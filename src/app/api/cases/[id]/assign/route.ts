import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildAssignmentEmail } from "@/lib/email";
import { getAccessContext } from "@/lib/access";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { assignedToId, nextStatus, comment } = body;

    if (!assignedToId) return NextResponse.json({ error: "Assignee required" }, { status: 400 });

    const [caseData, assignee] = await Promise.all([
      prisma.case.findUnique({ where: { id }, select: { referenceNumber: true, title: true, status: true, severityLevel: true } }),
      prisma.user.findUnique({ where: { id: assignedToId }, select: { id: true, name: true, email: true } }),
    ]);

    if (!caseData) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });

    // Update the case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        assignedToId,
        status: nextStatus || caseData.status,
        reassignedAt: new Date(),
        reassignedFromId: access.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        caseId: id,
        action: "assigned",
        userId: access.user.id,
        comment: comment || `Case assigned to ${assignee.name}${nextStatus ? ` | Status → ${nextStatus}` : ""}`,
        metadata: JSON.stringify({ assignedToId, previousStatus: caseData.status, newStatus: nextStatus }),
      },
    });

    // Create task for the assignee with clear action description
    const stepDescriptions: Record<string,string> = {
      "new_submission":     "Your task: Verify this submission. Open the ✓ Verify tab — complete the checklist, capture GPS, upload evidence, then submit.",
      "under_verification": "Your task: Classify this case. Open the ✓ Classify tab — set severity, sector and root cause, then click Classify Case.",
      "classified":         "Your task: Assign this case to the right provincial coordinator.",
      "assigned":           "Your task: Submit a detailed action plan with timeline and resources in the Action Plan tab.",
      "action_plan":        "Your task: Begin on-ground intervention. Upload field evidence and update progress % regularly.",
      "intervention":       "Your task: Verify intervention is complete. Review evidence and mark resolved when satisfied.",
      "monitoring":         "Your task: Respond to this escalation and provide your decision.",
      "escalated":          "Your task: Respond to this escalation and mark it resolved with your decision.",
      "resolved":           "Your task: Review and formally close this case.",
    };
    // Always use the CURRENT case status to describe what the assignee will DO
    const taskDesc = stepDescriptions[caseData.status] || `Action required at step: ${caseData.status}`;

    await prisma.task.create({
      data: {
        title: `[${caseData.referenceNumber}] ${caseData.title.substring(0, 80)}`,
        description: taskDesc,
        status: "pending",
        priority: caseData.severityLevel === "Critical" ? "critical" : caseData.severityLevel === "High" ? "high" : "medium",
        assignedToId,
        createdById: access.user.id,
        caseId: id,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        title: "Case Assigned to You",
        message: `${caseData.referenceNumber} — ${caseData.title.substring(0, 80)} has been assigned to you.`,
        type: "assignment",
        caseId: id,
      },
    });

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sd-coordination-hub.vercel.app";
    await sendEmail({
      to: assignee.email,
      subject: `[Action Required] Case ${caseData.referenceNumber} assigned to you`,
      html: buildAssignmentEmail({
        recipientName: assignee.name,
        caseRef: caseData.referenceNumber,
        caseTitle: caseData.title,
        step: nextStatus || caseData.status,
        assignerName: access.user.name,
        caseUrl: `${baseUrl}/dashboard/cases/${id}`,
      }),
    });

    return NextResponse.json({ success: true, case: updatedCase, emailSent: true });
  } catch (error: any) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "Failed to assign case" }, { status: 500 });
  }
}
