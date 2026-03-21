import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isOptOutKeyword } from "@/lib/marketing/twilio";
import { unsubscribeLead } from "@/lib/marketing/leads";
import { pauseCampaignsForLead } from "@/lib/marketing/drip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string | null;
    const body = formData.get("Body") as string | null;
    const messageStatus = formData.get("MessageStatus") as string | null;

    // Handle opt-out via incoming SMS
    if (from && body && isOptOutKeyword(body)) {
      const supabase = getAdminSupabase();
      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", from)
        .single();

      if (lead) {
        await unsubscribeLead(lead.id, "sms");
        await pauseCampaignsForLead(lead.id, "sms");
      }
    }

    // Log delivery status updates
    if (messageStatus) {
      console.log(`Twilio webhook: ${messageStatus} from ${from ?? "unknown"}`);
    }

    // Twilio expects a 200 with TwiML or empty body
    return new NextResponse("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("Twilio webhook error:", err);
    return new NextResponse("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
