import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseIsInScope, getAccessContext } from "@/lib/access";

// POST /api/cases/[id]/escalate
export async function POST(
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

    const caseRecord = await prisma.case.findUnique({ where: { id } });
    if (!caseRecord || !caseIsInScope(access, caseRecord.provinceId)) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Determine next escalation level
    const currentLevel = caseRecord.escalationLevel || "none";
    const levels = ["none", "L1", "L2", "L3", "L4", "L5"];
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[Math.min(currentIndex + 1, levels.length - 1)];

    if (nextLevel === currentLevel) {
      return NextResponse.json(
        { error: "Case is already at maximum escalation level" },
        { status: 400 }
      );
    }

    const escalationTargets: Record<string, string> = {
      L1: "Municipal Manager",
      L2: "Provincial COGTA",
      L3: "Sector Department",
      L4: "DG/Steerco",
      L5: "Minister",
    };

    // Create escalation record
    const escalation = await prisma.escalation.create({
      data: {
        caseId: id,
        level: nextLevel,
        reason: body.reason || "Automatic escalation due to SLA breach",
        escalatedTo: escalationTargets[nextLevel] || "Unknown",
        status: "active",
      },
    });

    // Update case
    await prisma.case.update({
      where: { id },
      data: {
        escalationLevel: nextLevel,
        status: "escalated",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        caseId: id,
        userId: access.user.id,
        action: "ESCALATED",
        comment: `Escalated to ${nextLevel} (${escalationTargets[nextLevel]}). Reason: ${body.reason || "SLA breach"}`,
      },
    });

    return NextResponse.json(escalation, { status: 201 });
  } catch (error) {
    console.error("Escalate error:", error);
    return NextResponse.json(
      { error: "Failed to escalate case" },
      { status: 500 }
    );
  }
}
