import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events, particularly for Connect account updates
 * 
 * Setup in Stripe Dashboard:
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/stripe
 * 3. Select events:
 *    - account.updated (for Connect onboarding completion)
 *    - checkout.session.completed (for invoice payments)
 *    - payment_intent.succeeded (for successful payments)
 * 4. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature found" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    // Handle different event types
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle account.updated event (Stripe Connect account status changes)
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const accountId = account.id;
  const isOnboarded =
    account.details_submitted && account.charges_enabled && account.payouts_enabled;

  // Update firm record with onboarding status
  await prisma.firm.updateMany({
    where: { stripeConnectAccountId: accountId },
    data: { stripeConnectOnboardingCompleted: isOnboarded },
  });

  console.log(`Updated Stripe Connect account ${accountId}: onboarded=${isOnboarded}`);
}

/**
 * Handle checkout.session.completed event (when a payment is completed)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const paymentIntentId = session.payment_intent as string;

  // Find invoice by stripeSessionId
  const invoice = await prisma.invoice.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      firm: {
        select: {
          stripeConnectAccountId: true,
        },
      },
    },
  });

  if (!invoice) {
    console.log(`No invoice found for session ${sessionId}`);
    return;
  }

  // Update invoice status to PAID
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
    },
  });

  console.log(`Invoice ${invoice.id} marked as paid`);

  // If this invoice is linked to a Lead, convert it to CONVERTED
  if (invoice.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: invoice.leadId },
    });

    if (lead && lead.status !== "CONVERTED") {
      await prisma.lead.update({
        where: { id: invoice.leadId },
        data: {
          status: "CONVERTED",
        },
      });

      console.log(`Lead ${invoice.leadId} automatically converted to CONVERTED after payment`);
    }
  }
}

/**
 * Handle payment_intent.succeeded event (alternative payment confirmation)
 * This is a fallback handler in case checkout.session.completed doesn't fire
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  // Try to find invoice by payment intent ID
  const invoice = await prisma.invoice.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (invoice) {
    // Invoice already updated by checkout.session.completed
    console.log(`Invoice ${invoice.id} already processed via PaymentIntent ${paymentIntentId}`);
    return;
  }

  // If not found, try to find by metadata (legacy support)
  if (paymentIntent.metadata?.invoiceId) {
    const invoiceId = paymentIntent.metadata.invoiceId;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      console.log(`Invoice ${invoiceId} marked as paid via PaymentIntent`);

      // Convert Lead if linked
      if (invoice.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: invoice.leadId },
        });

        if (lead && lead.status !== "CONVERTED") {
          await prisma.lead.update({
            where: { id: invoice.leadId },
            data: {
              status: "CONVERTED",
            },
          });

          console.log(`Lead ${invoice.leadId} automatically converted to CONVERTED after payment`);
        }
      }
    }
  }
}

