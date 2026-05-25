import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sectors = await prisma.sector.findMany({
      include: {
        _count: { select: { cases: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ sectors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sectors" }, { status: 500 });
  }
}