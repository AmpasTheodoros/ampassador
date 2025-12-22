import { Resend } from "resend";

/**
 * Resend Client Initialization
 * 
 * Creates a Resend client instance for sending emails.
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: Your Resend API key
 */

let resendClient: Resend | null = null;

/**
 * Get or create Resend client instance
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("Resend API key not configured. Email functionality will be disabled.");
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Send email via Resend
 * 
 * @param options - Email options
 * @returns Promise with email ID or null if Resend is not configured
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResendClient();

  if (!client) {
    return {
      success: false,
      error: "Resend is not configured. Please set RESEND_API_KEY environment variable.",
    };
  }

  const fromEmail = from || process.env.RESEND_FROM_EMAIL || "Ampassador <noreply@ampassador.com>";

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend Email Error:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error("Resend Email Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

