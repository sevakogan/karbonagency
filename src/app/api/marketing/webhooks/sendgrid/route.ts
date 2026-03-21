import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { unsubscribeLead } from "@/lib/marketing/leads";
import { pauseCampaignsForLead } from "@/lib/marketing/drip";

interface SendGridEvent {
  readonly email: string;
  readonly event: string;
  readonly reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const events: readonly SendGridEvent[] = await req.json();

    const supabase = getAdminSupabase();

    for (const event of events) {
      // Handle bounces and unsubscribes
      if (
        event.event === "bounce" ||
        event.event === "unsubscribe" ||
        event.event === "spamreport"
      ) {
        const { data: lead } = await supabase
          .from("leads")
          .select("id")
          .eq("email", event.email)
          .single();

        if (lead) {
          await unsubscribeLead(lead.id, "email");
          await pauseCampaignsForLead(lead.id, "email");
        }

        console.log(
          `SendGrid ${event.event}: ${event.email}${event.reason ? ` (${event.reason})` : ""}`
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("SendGrid webhook error:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
