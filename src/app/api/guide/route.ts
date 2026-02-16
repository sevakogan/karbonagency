import { NextRequest, NextResponse } from "next/server";
import { createContactSubmission, createLead } from "@/lib/db";
import { createGHLContact } from "@/lib/ghl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const phone = (body.phone || "").trim();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, message: "Name, email, and phone are required" },
        { status: 400 },
      );
    }

    // Save to Supabase + GHL in parallel (non-blocking for the user)
    await Promise.all([
      createContactSubmission({
        name,
        email,
        phone,
        message: "[Guide Download] Sim Center Guide requested",
      }),
      createGHLContact({
        name,
        email,
        phone,
        message: "Downloaded: Sim Center Guide",
      }),
      createLead({
        name,
        email,
        phone,
        source: "guide_download",
        notes: "Downloaded the Sim Center Guide PDF",
      }).catch((err) => {
        console.error("Lead creation failed (non-blocking):", err);
        return null;
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to submit" },
      { status: 500 },
    );
  }
}
