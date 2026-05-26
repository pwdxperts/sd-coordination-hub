import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sectorId, description } = body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (sectorId !== undefined) data.sectorId = sectorId;
    if (description !== undefined) data.description = description;
    const category = await prisma.failureCategory.update({
      where: { id },
      data,
      include: { sector: { select: { name: true } } },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.failureCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") return NextResponse.json({ error: "Cannot delete category with linked cases" }, { status: 409 });
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
