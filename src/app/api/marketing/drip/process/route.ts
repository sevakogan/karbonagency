import { NextRequest, NextResponse } from "next/server";
import { processNextDripMessages } from "@/lib/marketing/drip";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret — Vercel sends Authorization header for cron jobs
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processNextDripMessages();

    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Drip processing failed:", err);
    return NextResponse.json(
      { error: "Failed to process drip messages" },
      { status: 500 }
    );
  }
}
