import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cases/[id] - Full case detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
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

    if (!caseDetail) {
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
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Status transition validation
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

    // Build update data
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
      "milestonesJson", "progressPercent", "blockers",
      "resolutionNotes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.status === "resolved") {
      updateData.dateResolved = new Date();
    }

    const updated = await prisma.case.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    const changes: string[] = [];
    for (const field of Object.keys(updateData)) {
      const oldVal = (existing as any)[field];
      const newVal = updateData[field];
      if (String(oldVal) !== String(newVal)) {
        changes.push(`${field}: ${oldVal} → ${newVal}`);
      }
    }

    if (changes.length > 0) {
      await prisma.auditLog.create({
        data: {
          caseId: id,
          userId: body.updatedBy || null,
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
