import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [auditLogs, comments, evidence, escalations] = await Promise.all([
    prisma.auditLog.findMany({
      where: { caseId: id },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.caseComment.findMany({
      where: { caseId: id },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.evidence.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.escalation.findMany({
      where: { caseId: id },
      orderBy: { escalatedAt: "desc" },
    }),
  ]);

  // Merge into timeline
  const timeline: any[] = [
    ...auditLogs.map(l => ({ type: "audit", date: l.createdAt, data: l })),
    ...comments.map(c => ({ type: "comment", date: c.createdAt, data: c })),
    ...evidence.map(e => ({ type: "evidence", date: e.createdAt, data: e })),
    ...escalations.map(e => ({ type: "escalation", date: e.escalatedAt, data: e })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ timeline });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { comment, userId } = body;
  if (!comment) return NextResponse.json({ error: "Comment required" }, { status: 400 });

  const newComment = await prisma.caseComment.create({
    data: { caseId: id, userId: userId || null, comment },
    include: { user: { select: { name: true, role: true } } },
  });

  await prisma.auditLog.create({
    data: { caseId: id, action: "comment_added", userId: userId || null, comment },
  });

  return NextResponse.json({ comment: newComment });
}
