import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enableMfa, parseSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const cookie = request.cookies.get("session")?.value;
    const session = parseSessionCookie(cookie);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const success = await enableMfa(session.userId, token);
    if (!success) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA verify error:", error);
    return NextResponse.json({ error: "Failed to verify MFA" }, { status: 500 });
  }
}
