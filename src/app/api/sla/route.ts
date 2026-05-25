import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sla = await prisma.slaConfig.findMany({
      orderBy: { severityLevel: "asc" },
    });
    return NextResponse.json({ sla });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch SLA configs" }, { status: 500 });
  }
}
