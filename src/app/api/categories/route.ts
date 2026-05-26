import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.failureCategory.findMany({
      include: { sector: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sectorId, description } = body;
    if (!name || !sectorId) return NextResponse.json({ error: "Name and sector required" }, { status: 400 });
    const category = await prisma.failureCategory.create({
      data: { name, sectorId, description: description || null },
      include: { sector: { select: { name: true } } },
    });
    return NextResponse.json({ category });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Category already exists in this sector" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
