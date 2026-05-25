import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseIsInScope, getAccessContext, validateAssigneeForCase } from "@/lib/access";

// GET /api/cases/[id] - Full case detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const caseDetail = await prisma.case.findUnique({
      where: { id },
      include: {
        province: true,
        district: true,
        municipality: true,
        sector: true,
        failureCategory: true,
        leadDepartment: true,
        assignedTo: { select: { id: true, name: true, email: true, role: true, province: true } },
        owner: { select: { id: true, name: true, email: true, role: true } },
        evidence: { orderBy: { createdAt: "desc" } },
        comments: { orderBy: { createdAt: "desc" } },
        milestones: { orderBy: { order: "asc" } },
        escalations: { orderBy: { escalatedAt: "desc" } },
        auditLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caseDetail || !caseIsInScope(access, caseDetail.provinceId)) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseDetail);
  } catch (error) {
    console.error("Case detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing || !caseIsInScope(access, existing.provinceId)) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const validTransitions: Record<string, string[]> = {
      new_submission: ["under_verification", "rejected"],
      under_verification: ["classified", "duplicate", "rejected"],
      duplicate: ["converted"],
      classified: ["assigned"],
      assigned: ["action_plan", "escalated"],
      action_plan: ["intervention", "escalated"],
      intervention: ["monitoring", "escalated"],
      monitoring: ["resolved", "escalated"],
      escalated: ["intervention", "resolved"],
      resolved: ["closed", "reopened"],
      closed: ["reopened"],
      reopened: ["action_plan", "intervention"],
    };

    if (body.status && body.status !== existing.status) {
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from '${existing.status}' to '${body.status}'` },
          { status: 400 }
        );
      }
    }

    if (body.status === "assigned" && !body.assignedToId && !existing.assignedToId) {
      return NextResponse.json(
        { error: "Choose an individual assignee before moving this case to Assigned" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    const allowedFields = [
      "title", "description", "status", "severityScore", "severityLevel",
      "severityOverride", "severityOverrideReason", "populationAffected",
      "publicSafetyRisk", "durationDays", "isRecurring", "protestMediaFlag",
      "provinceId", "districtId", "municipalityId", "ward",
      "sectorId", "failureCategoryId", "subCategory", "rootCause",
      "responsibleSphere", "departmentId", "implementingAgent",
      "accountableOfficial", "contactDetails", "assignedToId", "ownerId",
      "actionPlan", "actionPlanDueDate", "interventionPlan",
      "progressPercent", "blockers", "resolutionNotes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const targetProvinceId = updateData.provinceId !== undefined ? updateData.provinceId : existing.provinceId;
    if (access.isProvinceScoped && targetProvinceId !== access.provinceId) {
      return NextResponse.json({ error: "You can only work on cases in your province" }, { status: 403 });
    }

    if (updateData.assignedToId !== undefined) {
      const assigneeCheck = await validateAssigneeForCase(access, updateData.assignedToId, targetProvinceId);
      if (!assigneeCheck.ok) {
        return NextResponse.json({ error: assigneeCheck.error }, { status: 400 });
      }

      if (existing.assignedToId !== updateData.assignedToId) {
        updateData.reassignedFromId = existing.assignedToId || null;
        updateData.reassignedAt = new Date();
      }
    }

    if (body.status === "resolved") {
      updateData.dateResolved = new Date();
    }

    const updated = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        province: true,
        sector: true,
        assignedTo: { select: { id: true, name: true, email: true, role: true, province: true } },
      },
    });

    const changes: string[] = [];
    for (const field of Object.keys(updateData)) {
      const oldVal = (existing as any)[field];
      const newVal = updateData[field];
      if (String(oldVal) !== String(newVal)) {
        changes.push(`${field}: ${oldVal} -> ${newVal}`);
      }
    }

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          caseId: id,
          userId: access.user.id,
          action: "CASE_UPDATED",
          comment: changes.join("; "),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Case PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}
