import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext, scopedCaseWhere } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const caseWhere = scopedCaseWhere(access);
    const [totalCases, criticalCases, highCases, moderateCases, stableCases, resolvedCases, overdueCases] = await Promise.all([
      prisma.case.count({ where: caseWhere }),
      prisma.case.count({ where: { ...caseWhere, severityLevel: "Critical" } }),
      prisma.case.count({ where: { ...caseWhere, severityLevel: "High" } }),
      prisma.case.count({ where: { ...caseWhere, severityLevel: "Moderate" } }),
      prisma.case.count({ where: { ...caseWhere, severityLevel: "Stable" } }),
      prisma.case.count({ where: { ...caseWhere, status: { in: ["resolved", "closed"] } } }),
      prisma.case.count({ where: { ...caseWhere, slaDeadline: { lt: new Date() }, status: { notIn: ["resolved", "closed"] } } }),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const escalationWhere: any = { status: "active", escalatedAt: { gte: today, lt: tomorrow } };
    if (access.isProvinceScoped) escalationWhere.case = { provinceId: access.provinceId || "__no_province_scope__" };
    const escalationsDueToday = await prisma.escalation.count({ where: escalationWhere });

    const provinces = await prisma.province.findMany({
      where: access.isProvinceScoped ? { id: access.provinceId || "__no_province_scope__" } : undefined,
    });

    const casesByProvince = await Promise.all(provinces.map(async (province) => {
      const [total, resolved] = await Promise.all([
        prisma.case.count({ where: { ...caseWhere, provinceId: province.id } }),
        prisma.case.count({ where: { ...caseWhere, provinceId: province.id, status: { in: ["resolved", "closed"] } } }),
      ]);
      return { id: province.id, name: province.name, count: total, resolved };
    }));

    const sectors = await prisma.sector.findMany();
    const casesBySector = await Promise.all(sectors.map(async (sector) => {
      const [critical, high, moderate, stable] = await Promise.all([
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Critical" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "High" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Moderate" } }),
        prisma.case.count({ where: { ...caseWhere, sectorId: sector.id, severityLevel: "Stable" } }),
      ]);
      return { id: sector.id, name: sector.name, critical, high, moderate, stable, total: critical + high + moderate + stable };
    }));

    const statuses = ["new_submission","under_verification","duplicate","classified","assigned","action_plan","intervention","monitoring","escalated","resolved","closed","reopened"];
    const casesByStatus = await Promise.all(statuses.map(async (status) => ({
      status, count: await prisma.case.count({ where: { ...caseWhere, status } }),
    })));

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
      totalCases, bySeverity: { critical: criticalCases, high: highCases, moderate: moderateCases, stable: stableCases },
      resolvedCases, overdueCases, escalationsDueToday,
      casesByProvince, casesBySector, casesByStatus, recentCritical,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
