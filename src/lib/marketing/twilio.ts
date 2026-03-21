/**
 * Twilio — SMS messaging
 *
 * Part of the unified Twilio setup:
 *   SMS   → This module (Twilio Messaging API)
 *   Email → ./sendgrid.ts (Twilio SendGrid)
 *
 * Env vars needed:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER
 */

import Twilio from "twilio";
import { MARKETING_CONFIG } from "./config";

function getTwilioClient() {
  return Twilio(
    MARKETING_CONFIG.twilio.accountSid(),
    MARKETING_CONFIG.twilio.authToken()
  );
}

export async function sendSMS(to: string, body: string) {
  const client = getTwilioClient();
  const message = await client.messages.create({
    body,
    from: MARKETING_CONFIG.twilio.phoneNumber(),
    to,
  });
  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
  };
}

export function isOptOutKeyword(body: string): boolean {
  const normalized = body.trim().toUpperCase();
  const optOutWords = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
  return optOutWords.includes(normalized);
}
