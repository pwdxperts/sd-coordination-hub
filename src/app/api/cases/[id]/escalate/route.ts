import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";
import { sendEmail } from "@/lib/email";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const escalations = await prisma.escalation.findMany({
    where: { caseId: id },
    orderBy: { escalatedAt: "desc" },
  });
  return NextResponse.json({ escalations });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { level, reason, escalatedTo } = body;
    if (!level || !reason) return NextResponse.json({ error: "Level and reason required" }, { status: 400 });

    const caseData = await prisma.case.findUnique({
      where: { id },
      select: { referenceNumber: true, title: true, severityLevel: true },
    });
    if (!caseData) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const escalation = await prisma.escalation.create({
      data: { caseId: id, level, reason, escalatedTo: escalatedTo || null, status: "active" },
    });

    // Update case status to escalated
    await prisma.case.update({
      where: { id },
      data: { status: "escalated", escalationLevel: level },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        caseId: id,
        action: "escalated",
        userId: access.user.id,
        comment: `Escalated to ${level} — ${reason}`,
        metadata: JSON.stringify({ level, escalatedTo }),
      },
    });

    // Notify escalation target
    if (escalatedTo) {
      const user = await prisma.user.findUnique({ where: { id: escalatedTo }, select: { name: true, email: true } });
      if (user) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sd-coordination-hub.vercel.app";
        await sendEmail({
          to: user.email,
          subject: `[ESCALATION ${level}] Case ${caseData.referenceNumber} requires your attention`,
          html: `<div style="font-family:Arial,sans-serif;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;max-width:560px;margin:0 auto;">
            <div style="background:#DC2626;color:#fff;padding:16px 20px;border-radius:6px;margin-bottom:20px;">
              <strong>⚠ ESCALATION ${level}</strong>
            </div>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Case <strong>${caseData.referenceNumber}</strong> — <em>${caseData.title}</em> has been escalated to <strong>${level}</strong> and requires your urgent attention.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Escalated by:</strong> ${access.user.name}</p>
            <a href="${baseUrl}/dashboard/cases/${id}" style="display:inline-block;background:#DC2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px;">Review Case →</a>
          </div>`,
        });
      }
    }

    return NextResponse.json({ success: true, escalation });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create escalation" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const body = await request.json();
  const { escalationId, status, response, respondedBy } = body;
  if (!escalationId) return NextResponse.json({ error: "escalationId required" }, { status: 400 });

  const escalation = await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      status: status || "resolved",
      response: response || null,
      respondedBy: respondedBy || null,
      respondedAt: new Date(),
    },
  });

  if (status === "resolved") {
    await prisma.case.update({ where: { id: caseId }, data: { status: "monitoring", escalationLevel: null } });
  }

  return NextResponse.json({ success: true, escalation });
}
