import Stripe from "stripe";

/**
 * Stripe Client Initialization
 * 
 * This is the main Stripe instance using your platform's secret key.
 * Use this for:
 * - Creating Connect accounts
 * - Creating Checkout Sessions (on behalf of connected accounts)
 * - Managing Connect onboarding
 * 
 * For operations on connected accounts (the law firm's account),
 * use stripe.asAccount(accountId) or pass stripe_account header.
 */

// Use placeholder key during build, will be validated at runtime
const getStripeKey = (): string => {
  return process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build_time_only";
};

export const stripe = new Stripe(getStripeKey(), {
  apiVersion: "2025-12-15.clover", // Latest stable version
  typescript: true,
});

/**
 * Get the Stripe publishable key (for client-side use)
 */
export const getStripePublishableKey = (): string => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  }
  return key;
};

