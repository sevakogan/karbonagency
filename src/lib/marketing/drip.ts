import { getAdminSupabase } from "@/lib/supabase-admin";
import { sendSMS } from "./twilio";
import { sendEmail } from "./sendgrid";
import { getDripSMS, getDripEmail } from "./templates";
import type { DripCampaign, DripMessage, Lead, SendResult } from "./types";

export async function getActiveCampaigns(): Promise<readonly DripCampaign[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("drip_campaigns")
    .select("*")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return data as DripCampaign[];
}

export async function enrollLeadInCampaigns(lead: Lead): Promise<void> {
  const campaigns = await getActiveCampaigns();
  const supabase = getAdminSupabase();

  const enrollments = campaigns
    .filter((campaign) => {
      if (campaign.channel === "sms" && !lead.sms_consent) return false;
      if (campaign.channel === "email" && !lead.email_consent) return false;
      return true;
    })
    .map((campaign) => {
      const messages = campaign.messages as readonly DripMessage[];
      const firstMessage = messages[0];
      const delayMs = (firstMessage?.delay_days ?? 0) * 24 * 60 * 60 * 1000;

      return {
        lead_id: lead.id,
        campaign_id: campaign.id,
        current_step: 0,
        next_send_at: new Date(Date.now() + delayMs).toISOString(),
        status: "active" as const,
      };
    });

  if (enrollments.length === 0) return;

  const { error } = await supabase.from("lead_drip_state").insert(enrollments);

  if (error) {
    throw new Error(`Failed to enroll lead in campaigns: ${error.message}`);
  }
}

export async function processNextDripMessages(): Promise<SendResult> {
  const supabase = getAdminSupabase();
  let sent = 0;
  let errors = 0;

  // Fetch drip states that are due
  const { data: dueStates, error: fetchError } = await supabase
    .from("lead_drip_state")
    .select("*, leads(*), drip_campaigns(*)")
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString());

  if (fetchError) {
    throw new Error(`Failed to fetch due drip states: ${fetchError.message}`);
  }

  if (!dueStates || dueStates.length === 0) {
    return { sent: 0, errors: 0 };
  }

  for (const state of dueStates) {
    const lead = state.leads as unknown as Lead;
    const campaign = state.drip_campaigns as unknown as DripCampaign;
    const messages = campaign.messages as readonly DripMessage[];
    const currentMessage = messages[state.current_step];

    if (!currentMessage || !lead) {
      errors++;
      continue;
    }

    try {
      if (campaign.channel === "sms" && lead.sms_consent) {
        const body = currentMessage.body || getDripSMS(state.current_step, lead);
        await sendSMS(lead.phone, body);
      } else if (campaign.channel === "email" && lead.email_consent) {
        const emailContent = getDripEmail(state.current_step, lead);
        const subject = currentMessage.subject || emailContent.subject;
        const html = emailContent.html;
        await sendEmail(lead.email, subject, html);
      }

      sent++;
    } catch (err) {
      console.error(`Drip send failed for lead ${lead.id}, campaign ${campaign.id}:`, err);
      errors++;
      continue;
    }

    // Advance to next step
    const nextStep = state.current_step + 1;
    const isComplete = nextStep >= messages.length;

    if (isComplete) {
      await supabase
        .from("lead_drip_state")
        .update({
          status: "completed",
          current_step: nextStep,
          last_sent_at: new Date().toISOString(),
          next_send_at: null,
        })
        .eq("id", state.id);
    } else {
      const nextMessage = messages[nextStep];
      const delayMs = (nextMessage?.delay_days ?? 1) * 24 * 60 * 60 * 1000;

      await supabase
        .from("lead_drip_state")
        .update({
          current_step: nextStep,
          last_sent_at: new Date().toISOString(),
          next_send_at: new Date(Date.now() + delayMs).toISOString(),
        })
        .eq("id", state.id);
    }
  }

  return { sent, errors };
}

export async function pauseCampaignsForLead(
  leadId: string,
  channel: "sms" | "email"
): Promise<void> {
  const supabase = getAdminSupabase();

  // Get campaigns matching the channel
  const campaigns = await getActiveCampaigns();
  const channelCampaignIds = campaigns
    .filter((c) => c.channel === channel)
    .map((c) => c.id);

  if (channelCampaignIds.length === 0) return;

  const { error } = await supabase
    .from("lead_drip_state")
    .update({ status: "unsubscribed" })
    .eq("lead_id", leadId)
    .in("campaign_id", channelCampaignIds)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to pause campaigns: ${error.message}`);
  }
}
