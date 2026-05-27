import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logs = await prisma.auditLog.findMany({
    where: { caseId: id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ logs });
}
