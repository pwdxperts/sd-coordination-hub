import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, active } = body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;
    const sector = await prisma.sector.update({ where: { id }, data, include: { _count: { select: { cases: true } } } });
    return NextResponse.json({ sector });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Sector name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to update sector" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.sector.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") return NextResponse.json({ error: "Cannot delete sector with linked cases or categories" }, { status: 409 });
    return NextResponse.json({ error: "Failed to delete sector" }, { status: 500 });
  }
}
