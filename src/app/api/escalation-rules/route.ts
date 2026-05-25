import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rules = await prisma.escalationRule.findMany({
      orderBy: { afterHours: "asc" },
    });
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch escalation rules" }, { status: 500 });
  }
}
