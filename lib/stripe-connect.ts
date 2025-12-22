import { stripe } from "./stripe";
import Stripe from "stripe";

/**
 * Stripe Connect Utilities
 * 
 * Helper functions for working with Stripe Connect accounts
 * (law firms' connected accounts)
 */

/**
 * Create a Checkout Session for an invoice
 * This will charge the customer and send the funds to the connected account (law firm)
 * 
 * @param invoiceId - The invoice ID from our database
 * @param connectedAccountId - The Stripe Connect account ID (law firm)
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'eur')
 * @param customerEmail - Customer's email
 * @param successUrl - URL to redirect to after successful payment
 * @param cancelUrl - URL to redirect to if payment is cancelled
 * @param applicationFeeAmount - Optional: platform fee in cents (your commission)
 */
export async function createInvoiceCheckoutSession({
  invoiceId,
  connectedAccountId,
  amount,
  currency = "eur",
  customerEmail,
  customerName,
  description,
  successUrl,
  cancelUrl,
  applicationFeeAmount,
}: {
  invoiceId: string;
  connectedAccountId: string;
  amount: number; // in cents
  currency?: string;
  customerEmail: string;
  customerName?: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  applicationFeeAmount?: number; // Platform fee in cents (optional)
}): Promise<Stripe.Checkout.Session> {
  // Create checkout session on behalf of the connected account
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || "Legal Services Invoice",
              description: customerName
                ? `Invoice for ${customerName}`
                : "Legal services invoice",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId,
        connectedAccountId,
      },
      // This is the key: specify which account receives the payment
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
      },
    },
    {
      // Stripe Connect: create on behalf of connected account
      stripeAccount: connectedAccountId,
    }
  );

  return session;
}

/**
 * Create a Payment Intent directly (for custom payment flows)
 * 
 * @param connectedAccountId - The Stripe Connect account ID
 * @param amount - Amount in cents
 * @param currency - Currency code
 * @param applicationFeeAmount - Optional platform fee
 */
export async function createPaymentIntent({
  connectedAccountId,
  amount,
  currency = "eur",
  metadata,
  applicationFeeAmount,
}: {
  connectedAccountId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  applicationFeeAmount?: number;
}): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount,
      currency: currency.toLowerCase(),
      metadata,
      application_fee_amount: applicationFeeAmount,
    },
    {
      stripeAccount: connectedAccountId,
    }
  );

  return paymentIntent;
}

/**
 * Get the status of a connected account
 */
export async function getConnectedAccountStatus(
  accountId: string
): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboarded: boolean;
}> {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    onboarded:
      account.details_submitted && account.charges_enabled && account.payouts_enabled,
  };
}

