/**
 * Marketing configuration — the ONLY file to customize per project snapshot.
 * All project-specific settings live here.
 *
 * All messaging goes through Twilio:
 *   SMS   → Twilio Messaging API (twilio.com)
 *   Email → Twilio SendGrid (sendgrid.com — a Twilio company)
 *
 * You only need one Twilio account for both SMS and email.
 */

export const MARKETING_CONFIG = {
  company: {
    name: "KarbonAgency",
    website: "https://karbonagency.com",
    supportEmail: "support@karbonagency.com",
  },

  /** Twilio — SMS messaging */
  twilio: {
    accountSid: () => process.env.TWILIO_ACCOUNT_SID!,
    authToken: () => process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: () => process.env.TWILIO_PHONE_NUMBER!,
  },

  /** Twilio SendGrid — email delivery (sendgrid.com is a Twilio product) */
  twilioEmail: {
    apiKey: () => process.env.SENDGRID_API_KEY!,
    fromEmail: () => process.env.SENDGRID_FROM_EMAIL || "support@karbonagency.com",
    fromName: () => "KarbonAgency",
  },

  cron: {
    secret: () => process.env.CRON_SECRET!,
  },

  webhooks: {
    secret: () => process.env.MARKETING_WEBHOOK_SECRET!,
  },
} as const;
