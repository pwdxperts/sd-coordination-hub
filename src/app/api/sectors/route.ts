import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sectors = await prisma.sector.findMany({
      include: { _count: { select: { cases: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ sectors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sectors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const sector = await prisma.sector.create({
      data: { name, description: description || null },
      include: { _count: { select: { cases: true } } },
    });
    return NextResponse.json({ sector });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Sector name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create sector" }, { status: 500 });
  }
}
