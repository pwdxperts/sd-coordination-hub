import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";
import { sendEmail, buildStatusUpdateEmail } from "@/lib/email";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.case.findUnique({
    where: { id },
    select: { actionPlan: true, actionPlanDueDate: true, actionPlanSubmittedAt: true, progressPercent: true, blockers: true, interventionPlan: true },
  });
  return NextResponse.json({ actionPlan: c });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { actionPlan, actionPlanDueDate, progressPercent, blockers, interventionPlan, newStatus } = body;

    const updateData: any = {};
    if (actionPlan !== undefined) { updateData.actionPlan = actionPlan; updateData.actionPlanSubmittedAt = new Date(); }
    if (actionPlanDueDate !== undefined) updateData.actionPlanDueDate = actionPlanDueDate ? new Date(actionPlanDueDate) : null;
    if (progressPercent !== undefined) updateData.progressPercent = Number(progressPercent);
    if (blockers !== undefined) updateData.blockers = blockers;
    if (interventionPlan !== undefined) updateData.interventionPlan = interventionPlan;
    if (newStatus !== undefined) updateData.status = newStatus;

    const updated = await prisma.case.update({ where: { id }, data: updateData });

    // Audit log
    const actionLabel = newStatus ? `Status → ${newStatus}` : "Action plan updated";
    await prisma.auditLog.create({
      data: {
        caseId: id,
        action: newStatus ? "status_changed" : "action_plan_updated",
        userId: access.user.id,
        comment: `${actionLabel} by ${access.user.name}`,
        metadata: JSON.stringify({ newStatus, progressPercent }),
      },
    });

    // Notify the case owner/assignee if status changed
    if (newStatus) {
      const caseWithUsers = await prisma.case.findUnique({
        where: { id },
        include: {
          assignedTo: { select: { name: true, email: true } },
          owner: { select: { name: true, email: true } },
        },
      });
      const notifyUser = caseWithUsers?.assignedTo || caseWithUsers?.owner;
      if (notifyUser && notifyUser.email !== access.user.email) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sd-coordination-hub.vercel.app";
        await sendEmail({
          to: notifyUser.email,
          subject: `Case ${updated.referenceNumber} status updated`,
          html: buildStatusUpdateEmail({
            recipientName: notifyUser.name,
            caseRef: updated.referenceNumber,
            caseTitle: updated.title,
            newStatus,
            updaterName: access.user.name,
            comment: body.comment,
            caseUrl: `${baseUrl}/dashboard/cases/${id}`,
          }),
        });
      }
    }

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update action plan" }, { status: 500 });
  }
}
