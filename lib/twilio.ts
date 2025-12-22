import Twilio from "twilio";

/**
 * Twilio Client Initialization
 * 
 * Creates a Twilio client instance for sending SMS messages.
 * 
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (e.g., +1234567890)
 */

let twilioClient: Twilio.Twilio | null = null;

/**
 * Get or create Twilio client instance
 */
export function getTwilioClient(): Twilio.Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured. SMS functionality will be disabled.");
    return null;
  }

  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Send SMS message
 * 
 * @param to - Recipient phone number (E.164 format, e.g., +306912345678)
 * @param body - Message body
 * @returns Promise with message SID or null if Twilio is not configured
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    return {
      success: false,
      error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
    };
  }

  try {
    // Normalize phone number (ensure it starts with +)
    const normalizedTo = to.startsWith("+") ? to : `+${to}`;

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format phone number for SMS (Greek format to E.164)
 * 
 * @param phone - Phone number in various formats
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneForSMS(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // If it already starts with +, return as is
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // If it starts with 0, replace with +30 (Greece)
  if (cleaned.startsWith("0")) {
    return `+30${cleaned.substring(1)}`;
  }

  // If it starts with 30, add +
  if (cleaned.startsWith("30")) {
    return `+${cleaned}`;
  }

  // If it's just digits (10 digits for Greek mobile), assume +30
  if (/^\d{10}$/.test(cleaned)) {
    return `+30${cleaned}`;
  }

  // Return as is if it doesn't match any pattern
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

