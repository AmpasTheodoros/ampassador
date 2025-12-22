import { requireOrgId } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Stripe Connect Onboarding API
 * 
 * Creates a Stripe Connect account for the law firm (if it doesn't exist)
 * and returns an onboarding link for the attorney to complete their bank details
 * 
 * POST /api/stripe/connect
 */
export async function POST() {
  try {
    // Get authenticated organization ID
    const clerkOrgId = await requireOrgId();

    // Get or create firm record
    let firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Firm not found. Please ensure your organization is set up." },
        { status: 404 }
      );
    }

    let stripeAccountId = firm.stripeConnectAccountId;

    // If no Stripe account exists, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "GR", // Default to Greece, can be made dynamic later
        email: firm.name, // You might want to get this from Clerk org metadata
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        // Optional: Pre-fill business type for lawyers
        business_type: "company",
      });

      stripeAccountId = account.id;

      // Save Stripe account ID to database
      firm = await prisma.firm.update({
        where: { clerkOrgId },
        data: {
          stripeConnectAccountId: stripeAccountId,
          stripeConnectOnboardingCompleted: false,
        },
      });
    } else {
      // Check if account is already fully onboarded
      const account = await stripe.accounts.retrieve(stripeAccountId);
      const isOnboarded = account.details_submitted && account.charges_enabled;

      if (isOnboarded && !firm.stripeConnectOnboardingCompleted) {
        await prisma.firm.update({
          where: { clerkOrgId },
          data: { stripeConnectOnboardingCompleted: true },
        });
      }

      // If already onboarded, return success
      if (isOnboarded) {
        return NextResponse.json({
          onboarded: true,
          message: "Stripe Connect account is already set up",
        });
      }
    }

    // Get base URL for redirect URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/settings/billing?refresh=true`,
      return_url: `${baseUrl}/dashboard/settings/billing?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
      onboarded: false,
    });
  } catch (error) {
    console.error("Stripe Connect Error:", error);

    // Handle Stripe API errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to create Stripe Connect account",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect
 * 
 * Check the current status of Stripe Connect onboarding
 */
export async function GET() {
  try {
    const clerkOrgId = await requireOrgId();

    const firm = await prisma.firm.findUnique({
      where: { clerkOrgId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        name: true,
      },
    });

    if (!firm) {
      return NextResponse.json(
        { error: "Firm not found" },
        { status: 404 }
      );
    }

    if (!firm.stripeConnectAccountId) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
        message: "No Stripe Connect account found",
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(firm.stripeConnectAccountId);

    const isOnboarded =
      account.details_submitted && account.charges_enabled && account.payouts_enabled;

    // Update our database if status changed
    if (isOnboarded !== firm.stripeConnectOnboardingCompleted) {
      await prisma.firm.update({
        where: { clerkOrgId },
        data: { stripeConnectOnboardingCompleted: isOnboarded },
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded: isOnboarded,
      accountId: firm.stripeConnectAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
    });
  } catch (error) {
    console.error("Stripe Connect Status Error:", error);

    return NextResponse.json(
      {
        error: "Failed to check Stripe Connect status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

