import { NextRequest, NextResponse } from "next/server";
import { unsubscribeLead } from "@/lib/marketing/leads";
import { pauseCampaignsForLead } from "@/lib/marketing/drip";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const leadId = req.nextUrl.searchParams.get("leadId");
    const channel = req.nextUrl.searchParams.get("channel");

    if (!leadId || (channel !== "sms" && channel !== "email")) {
      return NextResponse.json(
        { error: "Missing or invalid leadId/channel" },
        { status: 400 }
      );
    }

    await unsubscribeLead(leadId, channel);
    await pauseCampaignsForLead(leadId, channel);

    // Return a simple HTML page confirming unsubscribe
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <h1 style="font-size:24px;margin-bottom:16px;">You've been unsubscribed</h1>
    <p style="color:#8888a0;font-size:15px;">You will no longer receive ${channel} messages from us. We're sorry to see you go.</p>
  </div>
</body></html>`.trim();

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Unsubscribe failed:", err);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
