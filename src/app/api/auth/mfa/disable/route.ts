import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disableMfa, parseSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("session")?.value;
    const session = parseSessionCookie(cookie);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await disableMfa(session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA disable error:", error);
    return NextResponse.json({ error: "Failed to disable MFA" }, { status: 500 });
  }
}
