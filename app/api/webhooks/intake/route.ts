import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * Lead Intake Webhook
 * 
 * Handles new lead submissions from forms/landing pages
 * - Creates Lead record in database
 * - Sends SMS notification to attorney (via Twilio)
 * - Sends confirmation email to client
 * 
 * Security: Use webhook secret for production (WEBHOOK_SECRET env var)
 * For public forms, you can use a public key or API key per firm
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    // clerkOrgId can come from:
    // 1. Authenticated request (if form is on protected page)
    // 2. Webhook payload (if form has firm identifier)
    // 3. API key lookup (if using API keys per firm)
    const { clerkOrgId, name, email, phone, source, value, notes, description, webhookSecret } = body;

    // Optional: Verify webhook secret for security
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }

    if (!clerkOrgId || !name || !email || !description) {
      return NextResponse.json(
        { error: "Missing required fields: clerkOrgId, name, email, description" },
        { status: 400 }
      );
    }

    // Verify firm exists (sync check - ensures org is in our DB)
    const firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Firm not found. Please ensure the organization is set up." },
        { status: 404 }
      );
    }

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        clerkOrgId,
        name,
        email,
        phone: phone || null,
        description,
        source: source || "Unknown",
        value: value ? parseFloat(value) : null,
        notes: notes || null,
        status: "NEW",
      },
    });

    // TODO: Send SMS notification via Twilio
    // Example:
    // await sendSMS({
    //   to: firm.phone, // You'll need to add phone to Firm model
    //   message: `Νέος πελάτης: ${name} (${email}). Source: ${source}`,
    // });

    // TODO: Send confirmation email to client
    // Example:
    // await sendEmail({
    //   to: email,
    //   subject: "Λάβαμε το αίτημά σας",
    //   template: "lead-confirmation",
    //   data: { name, firmName: firm.name },
    // });

    return NextResponse.json(
      {
        success: true,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          status: lead.status,
        },
        message: "Lead created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead intake webhook error:", error);
    return NextResponse.json(
      {
        error: "Failed to process lead intake",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification/health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Lead intake webhook endpoint is active",
  });
}

