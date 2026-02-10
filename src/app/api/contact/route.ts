import { NextRequest, NextResponse } from "next/server";
import { createContactSubmission } from "@/lib/db";
import { createGHLContact } from "@/lib/ghl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const phone = (body.phone || "").trim() || undefined;
    const company = (body.company || "").trim() || undefined;
    const message = (body.message || "").trim();

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ success: false, message: "Name, email, phone, and message are required" }, { status: 400 });
    }

    // Save to Supabase and push to GoHighLevel in parallel
    const [id] = await Promise.all([
      createContactSubmission({
        name,
        email,
        phone,
        message: company ? `[${company}] ${message}` : message,
      }),
      createGHLContact({
        name,
        email,
        phone,
        ...(company ? { company } : {}),
        message,
      }),
    ]);

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to submit" }, { status: 500 });
  }
}
