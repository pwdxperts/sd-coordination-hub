import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext, scopedCaseWhere } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const caseWhere = scopedCaseWhere(access);
    const totalCases = await prisma.case.count({ where: caseWhere });

    const criticalCases = await prisma.case.count({ where: { ...caseWhere, severityLevel: "Critical" } });
    const highCases = await prisma.case.count({ where: { ...caseWhere, severityLevel: "High" } });
    const moderateCases = await prisma.case.count({ where: { ...caseWhere, severityLevel: "Moderate" } });
    const stableCases = await prisma.case.count({ where: { ...caseWhere, severityLevel: "Stable" } });

    const resolvedCases = await prisma.case.count({
      where: { ...caseWhere, status: { in: ["resolved", "closed"] } },
    });

    const overdueCases = await prisma.case.count({
      where: {
        ...caseWhere,
        slaDeadline: { lt: new Date() },
        status: { notIn: ["resolved", "closed"] },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const escalationWhere: any = {
      status: "active",
      escalatedAt: { gte: today, lt: tomorrow },
    };
    if (access.isProvinceScoped) {
      escalationWhere.case = { provinceId: access.provinceId || "__no_province_scope__" };
    }

    const escalationsDueToday = await prisma.escalation.count({ where: escalationWhere });

    const provinces = await prisma.province.findMany({
      where: access.isProvinceScoped ? { id: access.provinceId || "__no_province_scope__" } : undefined,
      include: {
        districts: {
          include: { municipalities: true },
        },
      },
    });

    const casesByProvince = [];
    for (const province of provinces) {
      const count = await prisma.case.count({ where: { ...caseWhere, provinceId: province.id } });
      casesByProvince.push({
        id: province.id,
        name: province.name,
        count,
      });
    }

    const sectors = await prisma.sector.findMany();
    const casesBySector = [];
    for (const sector of sectors) {
      const countBySeverity = await Promise.all([
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Critical" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "High" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Moderate" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Stable" } }),
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

    const statuses = [
      "new_submission", "under_verification", "duplicate", "classified",
      "assigned", "action_plan", "intervention", "monitoring",
      "escalated", "resolved", "closed", "reopened",
    ];
    const casesByStatus = [];
    for (const status of statuses) {
      const count = await prisma.case.count({ where: { ...caseWhere, status } });
      casesByStatus.push({ status, count });
    }

    const recentCritical = await prisma.case.findMany({
      where: { ...caseWhere, severityLevel: { in: ["Critical", "High"] } },
      include: {
        province: { select: { name: true } },
        sector: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      scope: access.isProvinceScoped ? { provinceId: access.provinceId, provinceName: access.provinceName } : null,
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
