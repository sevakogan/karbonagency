import { MARKETING_CONFIG } from "./config";
import type { Lead } from "./types";

const { company } = MARKETING_CONFIG;

// --- SMS Templates ---

export function getWelcomeSMS(lead: Lead): string {
  return (
    `Hi ${lead.name}! Thanks for reaching out to ${company.name}. ` +
    `We'll be in touch within 24hrs. Reply STOP to opt out.`
  );
}

export function getDripSMS(step: number, lead: Lead): string {
  const messages: readonly string[] = [
    `Hi ${lead.name}, quick question — what's your biggest challenge right now? We'd love to help. - ${company.name}`,
    `Did you know ${company.name} has helped clients increase efficiency by 40%? Check out our work: ${company.website}`,
    `Still thinking it over, ${lead.name}? Let's schedule a quick 15-min call. Reply YES to connect. - ${company.name}`,
    `Last check-in, ${lead.name}! We're here whenever you're ready. Visit ${company.website} or reply to chat. - ${company.name}`,
  ];

  return messages[step] ?? messages[messages.length - 1];
}

// --- Email Templates ---

export function getWelcomeEmail(lead: Lead): { subject: string; html: string } {
  return {
    subject: `Thanks for reaching out, ${lead.name}!`,
    html: buildEmailHTML({
      headline: `Welcome, ${lead.name}!`,
      body: `
        <p>Thank you for your interest in ${company.name}. We received your inquiry and a team member will follow up within 24 hours.</p>
        ${lead.project_interest ? `<p>We see you're interested in our <strong>${lead.project_interest}</strong> project — great choice!</p>` : ""}
        <p>In the meantime, feel free to explore our portfolio at <a href="${company.website}">${company.website}</a>.</p>
      `,
      cta: { text: "View Our Work", url: company.website },
      lead,
    }),
  };
}

export function getDripEmail(
  step: number,
  lead: Lead
): { subject: string; html: string } {
  const emails: readonly { subject: string; headline: string; body: string; ctaText: string }[] = [
    {
      subject: "Here's what we do best",
      headline: "Our Services",
      body: `<p>At ${company.name}, we specialize in building custom web applications, SaaS platforms, and digital experiences that drive real business results.</p><p>From concept to launch, we handle design, development, and deployment — so you can focus on what you do best.</p>`,
      ctaText: "See Our Services",
    },
    {
      subject: lead.project_interest
        ? `Case study: ${lead.project_interest}`
        : "See what we've built",
      headline: "Our Recent Work",
      body: `<p>Every project we build is tailored to our client's unique needs. We don't do cookie-cutter solutions.</p><p>Check out our portfolio to see real examples of the results we deliver.</p>`,
      ctaText: "View Case Studies",
    },
    {
      subject: "What our clients are saying",
      headline: "Client Results",
      body: `<p>Our clients see real, measurable improvements after working with us — from increased efficiency to higher revenue.</p><p>We'd love to help you achieve similar results.</p>`,
      ctaText: "Get Started",
    },
    {
      subject: `Ready to get started, ${lead.name}?`,
      headline: "Let's Build Something Great",
      body: `<p>We've enjoyed sharing our work with you over the past couple of weeks.</p><p>If you're ready to take the next step, we'd love to hop on a quick call to discuss your project. No pressure, no commitment — just a conversation.</p>`,
      ctaText: "Let's Talk",
    },
  ];

  const email = emails[step] ?? emails[emails.length - 1];

  return {
    subject: email.subject,
    html: buildEmailHTML({
      headline: email.headline,
      body: email.body,
      cta: { text: email.ctaText, url: company.website },
      lead,
    }),
  };
}

// --- Email HTML Builder ---

interface EmailParams {
  readonly headline: string;
  readonly body: string;
  readonly cta: { readonly text: string; readonly url: string };
  readonly lead: Lead;
}

function buildEmailHTML({ headline, body, cta, lead }: EmailParams): string {
  const unsubscribeUrl = `${company.website}/api/marketing/unsubscribe?leadId=${lead.id}&channel=email`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#12121a;border-radius:12px;border:1px solid rgba(30,30,46,0.5);">
        <tr><td style="padding:40px 40px 20px;">
          <h1 style="color:#ffffff;font-size:24px;margin:0 0 20px;">${headline}</h1>
          <div style="color:#8888a0;font-size:15px;line-height:1.6;">${body}</div>
        </td></tr>
        <tr><td style="padding:10px 40px 30px;" align="center">
          <a href="${cta.url}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:#ffffff;text-decoration:none;border-radius:24px;font-size:14px;font-weight:600;">${cta.text}</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(30,30,46,0.5);">
          <p style="color:#555570;font-size:12px;margin:0;text-align:center;">
            ${company.name} &middot; <a href="${unsubscribeUrl}" style="color:#555570;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
