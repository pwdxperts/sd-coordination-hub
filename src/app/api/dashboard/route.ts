import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Total cases
    const totalCases = await prisma.case.count();

    // Cases by severity
    const criticalCases = await prisma.case.count({ where: { severityLevel: "Critical" } });
    const highCases = await prisma.case.count({ where: { severityLevel: "High" } });
    const moderateCases = await prisma.case.count({ where: { severityLevel: "Moderate" } });
    const stableCases = await prisma.case.count({ where: { severityLevel: "Stable" } });

    // Resolved cases
    const resolvedCases = await prisma.case.count({
      where: { status: { in: ["resolved", "closed"] } },
    });

    // Overdue cases
    const overdueCases = await prisma.case.count({
      where: {
        slaDeadline: { lt: new Date() },
        status: { notIn: ["resolved", "closed"] },
      },
    });

    // Escalations due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const escalationsDueToday = await prisma.escalation.count({
      where: {
        status: "active",
        escalatedAt: { gte: today, lt: tomorrow },
      },
    });

    // Cases by province
    const provinces = await prisma.province.findMany({
      include: {
        districts: {
          include: { municipalities: true },
        },
      },
    });

    const casesByProvince = [];
    for (const province of provinces) {
      const count = await prisma.case.count({ where: { provinceId: province.id } });
      casesByProvince.push({
        id: province.id,
        name: province.name,
        count,
      });
    }

    // Cases by sector
    const sectors = await prisma.sector.findMany();
    const casesBySector = [];
    for (const sector of sectors) {
      const countBySeverity = await Promise.all([
        prisma.case.count({ where: { sectorId: sector.id, severityLevel: "Critical" } }),
        prisma.case.count({ where: { sectorId: sector.id, severityLevel: "High" } }),
        prisma.case.count({ where: { sectorId: sector.id, severityLevel: "Moderate" } }),
        prisma.case.count({ where: { sectorId: sector.id, severityLevel: "Stable" } }),
      ]);
      casesBySector.push({
        id: sector.id,
        name: sector.name,
        critical: countBySeverity[0],
        high: countBySeverity[1],
        moderate: countBySeverity[2],
        stable: countBySeverity[3],
        total: countBySeverity.reduce((a: number, b: number) => a + b, 0),
      });
    }

    // Cases by status
    const statuses = [
      "new_submission", "under_verification", "duplicate", "classified",
      "assigned", "action_plan", "intervention", "monitoring",
      "escalated", "resolved", "closed", "reopened",
    ];
    const casesByStatus = [];
    for (const status of statuses) {
      const count = await prisma.case.count({ where: { status } });
      casesByStatus.push({ status, count });
    }

    // Recent critical cases
    const recentCritical = await prisma.case.findMany({
      where: { severityLevel: { in: ["Critical", "High"] } },
      include: {
        province: { select: { name: true } },
        sector: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      totalCases,
      bySeverity: { critical: criticalCases, high: highCases, moderate: moderateCases, stable: stableCases },
      resolvedCases,
      overdueCases,
      escalationsDueToday,
      casesByProvince,
      casesBySector,
      casesByStatus,
      recentCritical,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
