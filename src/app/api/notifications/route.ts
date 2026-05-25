import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Count notifications - in this system, notifications are:
    // 1. New submissions awaiting intake review
    // 2. Active escalations
    // 3. Cases overdue on SLA

    const newSubmissions = await prisma.case.count({
      where: { status: "new_submission" },
    });

    const activeEscalations = await prisma.escalation.count({
      where: { status: "active" },
    });

    const overdueCases = await prisma.case.count({
      where: {
        status: { notIn: ["resolved", "closed"] },
        progressPercent: { lt: 100 },
      },
    });

    const count = newSubmissions + activeEscalations;

    // Build notification list
    const notifications: any[] = [];

    if (newSubmissions > 0) {
      const recent = await prisma.case.findMany({
        where: { status: "new_submission" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, referenceNumber: true, title: true, createdAt: true },
      });
      notifications.push({
        id: "new-submissions",
        type: "new_submission",
        title: `${newSubmissions} new submission${newSubmissions > 1 ? "s" : ""} awaiting review`,
        items: recent,
        count: newSubmissions,
      });
    }

    if (activeEscalations > 0) {
      const escalations = await prisma.escalation.findMany({
        where: { status: "active" },
        orderBy: { escalatedAt: "desc" },
        take: 5,
        include: { case: { select: { id: true, referenceNumber: true, title: true } } },
      });
      notifications.push({
        id: "active-escalations",
        type: "escalation",
        title: `${activeEscalations} active escalation${activeEscalations > 1 ? "s" : ""}`,
        items: escalations.map((e: any) => ({
          id: e.id,
          caseId: e.case?.id,
          reference: e.case?.referenceNumber,
          level: e.level,
          escalatedTo: e.escalatedTo,
        })),
        count: activeEscalations,
      });
    }

    return NextResponse.json({
      count,
      notifications,
      summaries: {
        newSubmissions,
        activeEscalations,
        overdueCases,
      },
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ count: 0, notifications: [], summaries: {} }, { status: 200 });
  }
}
