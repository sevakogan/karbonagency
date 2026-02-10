import { NextRequest, NextResponse } from "next/server";
import { createContactSubmission } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "Name, email, and message are required" }, { status: 400 });
    }

    const id = await createContactSubmission({
      name,
      email,
      phone: phone || "",
      message,
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to submit" }, { status: 500 });
  }
}
