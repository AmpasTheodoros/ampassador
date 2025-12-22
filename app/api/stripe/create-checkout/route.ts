import { requireOrgId } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendSMS, formatPhoneForSMS } from "@/lib/twilio";

/**
 * Create Stripe Checkout Session API
 * 
 * POST /api/stripe/create-checkout
 * 
 * Creates a Stripe Checkout Session for quick billing from a Lead.
 * The payment goes directly to the law firm's Stripe Connect account.
 * 
 * Body:
 * {
 *   amount: number (in EUR, e.g., 150)
 *   customerEmail: string
 *   description: string
 *   leadId?: string (optional, to link invoice to lead)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const clerkOrgId = await requireOrgId();
    const body = await req.json();
    const { amount, customerEmail, description, leadId } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Το ποσό πρέπει να είναι μεγαλύτερο από 0" },
        { status: 400 }
      );
    }

    if (!customerEmail || !description) {
      return NextResponse.json(
        { error: "Το email και η περιγραφή είναι υποχρεωτικά" },
        { status: 400 }
      );
    }

    // Find the firm and check Stripe Connect setup
    const firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        name: true,
      },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Το γραφείο δεν βρέθηκε" },
        { status: 404 }
      );
    }

    if (!firm.stripeConnectAccountId) {
      return NextResponse.json(
        {
          error: "Το γραφείο δεν έχει συνδέσει τραπεζικό λογαριασμό",
          message: "Παρακαλώ ολοκληρώστε πρώτα τη σύνδεση με Stripe Connect",
        },
        { status: 400 }
      );
    }

    if (!firm.stripeConnectOnboardingCompleted) {
      return NextResponse.json(
        {
          error: "Η σύνδεση με Stripe Connect δεν έχει ολοκληρωθεί",
          message: "Παρακαλώ ολοκληρώστε τη διαδικασία onboarding",
        },
        { status: 400 }
      );
    }

    // If leadId is provided, verify it belongs to the organization and get phone
    let customerPhone: string | null = null;
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          clerkOrgId,
        },
        select: {
          id: true,
          phone: true,
          name: true,
        },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Το Lead δεν βρέθηκε ή δεν ανήκει στο γραφείο σας" },
          { status: 404 }
        );
      }

      // Get phone number from lead if available
      customerPhone = lead.phone ? formatPhoneForSMS(lead.phone) : null;
    }

    // Get base URL for redirect URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Checkout Session on behalf of the connected account
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: description,
                description: `Τιμολόγιο από ${firm.name}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/leads`,
        customer_email: customerEmail,
        metadata: {
          clerkOrgId,
          leadId: leadId || "",
        },
      },
      {
        // The key: payments go to the law firm's Stripe Connect account
        stripeAccount: firm.stripeConnectAccountId,
      }
    );

    // Create invoice record in database
    const invoice = await prisma.invoice.create({
      data: {
        clerkOrgId,
        amount,
        stripeSessionId: session.id,
        customerEmail,
        description,
        status: "UNPAID",
        leadId: leadId || null,
      },
    });

    // Send SMS to customer with payment link (if phone is available)
    let smsResult: { success: boolean; messageSid?: string; error?: string } | null = null;
    if (customerPhone && session.url) {
      const smsMessage = `Γεια σας από το δικηγορικό γραφείο ${firm.name}. Για την έναρξη της υπόθεσής σας (${description}), παρακαλούμε ακολουθήστε το σύνδεσμο για την πληρωμή: ${session.url}`;
      
      smsResult = await sendSMS(customerPhone, smsMessage);
      
      if (!smsResult.success) {
        // Log error but don't fail the request - SMS is optional
        console.warn("Failed to send SMS:", smsResult.error);
      } else {
        console.log(`SMS sent successfully to ${customerPhone}. Message SID: ${smsResult.messageSid}`);
      }
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      invoiceId: invoice.id,
      sessionId: session.id,
      smsSent: smsResult?.success || false,
      smsError: smsResult?.error || null,
    });
  } catch (error) {
    console.error("Create Checkout Error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized", message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Αποτυχία δημιουργίας checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

