import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupMfa, parseSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("session")?.value;
    const session = parseSessionCookie(cookie);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await setupMfa(session.userId);
    if (!result) {
      return NextResponse.json({ error: "Failed to setup MFA" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("MFA setup error:", error);
    return NextResponse.json({ error: "Failed to setup MFA" }, { status: 500 });
  }
}
