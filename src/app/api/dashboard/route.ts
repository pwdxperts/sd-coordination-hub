import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext, scopedCaseWhere } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const caseWhere = scopedCaseWhere(access);

    // ── Core counts (all parallel) ──────────────────────────────────────────
    const [
      totalCases, resolvedCases, overdueCases,
      bySeverityRaw, byStatusRaw, byProvinceRaw, bySectorRaw,
      recentCritical, escalationsDueToday,
    ] = await Promise.all([
      prisma.case.count({ where: caseWhere }),
      prisma.case.count({ where: { ...caseWhere, status: { in: ["resolved", "closed"] } } }),
      prisma.case.count({ where: { ...caseWhere, slaDeadline: { lt: new Date() }, status: { notIn: ["resolved", "closed"] } } }),

      // GroupBy severity - one query instead of 4
      prisma.case.groupBy({ by: ["severityLevel"], where: caseWhere, _count: { id: true } }),

      // GroupBy status - one query instead of 12
      prisma.case.groupBy({ by: ["status"], where: caseWhere, _count: { id: true } }),

      // GroupBy province - one query instead of N
      prisma.case.groupBy({ by: ["provinceId"], where: caseWhere, _count: { id: true } }),

      // GroupBy sector - one query instead of N
      prisma.case.groupBy({ by: ["sectorId"], where: caseWhere, _count: { id: true } }),

      // Recent critical cases
      prisma.case.findMany({
        where: { ...caseWhere, severityLevel: { in: ["Critical", "High"] } },
        include: {
          province: { select: { name: true } },
          sector: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Escalations today
      prisma.escalation.count({
        where: {
          status: "active",
          ...(access.isProvinceScoped ? { case: { provinceId: access.provinceId || "__none__" } } : {}),
        },
      }),
    ]);

    // ── Shape severity ──────────────────────────────────────────────────────
    const bySeverity = { critical: 0, high: 0, moderate: 0, stable: 0 };
    for (const r of bySeverityRaw) {
      const k = r.severityLevel?.toLowerCase() as keyof typeof bySeverity;
      if (k in bySeverity) bySeverity[k] = r._count.id;
    }

    // ── Shape status ────────────────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const r of byStatusRaw) statusMap[r.status || "unknown"] = r._count.id;
    const statuses = ["new_submission","under_verification","duplicate","classified","assigned","action_plan","intervention","monitoring","escalated","resolved","closed","reopened"];
    const casesByStatus = statuses.map(s => ({ status: s, count: statusMap[s] || 0 }));

    // ── Shape province (resolve names in one query) ─────────────────────────
    const provinceIds = byProvinceRaw.map(r => r.provinceId).filter(Boolean) as string[];
    const resolvedByProvinceRaw = await prisma.case.groupBy({
      by: ["provinceId"],
      where: { ...caseWhere, status: { in: ["resolved", "closed"] } },
      _count: { id: true },
    });
    const resolvedProvMap: Record<string, number> = {};
    for (const r of resolvedByProvinceRaw) if (r.provinceId) resolvedProvMap[r.provinceId] = r._count.id;

    const provinces = provinceIds.length > 0
      ? await prisma.province.findMany({ where: { id: { in: provinceIds } }, select: { id: true, name: true } })
      : [];
    const provNameMap: Record<string, string> = {};
    for (const p of provinces) provNameMap[p.id] = p.name;

    const casesByProvince = byProvinceRaw
      .filter(r => r.provinceId && provNameMap[r.provinceId])
      .map(r => ({
        id: r.provinceId!,
        name: provNameMap[r.provinceId!],
        count: r._count.id,
        resolved: resolvedProvMap[r.provinceId!] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Shape sector ────────────────────────────────────────────────────────
    const sectorIds = bySectorRaw.map(r => r.sectorId).filter(Boolean) as string[];
    const sectors = sectorIds.length > 0
      ? await prisma.sector.findMany({ where: { id: { in: sectorIds } }, select: { id: true, name: true } })
      : [];
    const sectNameMap: Record<string, string> = {};
    for (const s of sectors) sectNameMap[s.id] = s.name;

    // Per-sector severity breakdown (one query)
    const bySectorSeverityRaw = await prisma.case.groupBy({
      by: ["sectorId", "severityLevel"],
      where: { ...caseWhere, sectorId: { in: sectorIds } },
      _count: { id: true },
    });
    const sectSevMap: Record<string, Record<string, number>> = {};
    for (const r of bySectorSeverityRaw) {
      if (!r.sectorId) continue;
      if (!sectSevMap[r.sectorId]) sectSevMap[r.sectorId] = {};
      sectSevMap[r.sectorId][r.severityLevel || "Moderate"] = r._count.id;
    }

    const casesBySector = bySectorRaw
      .filter(r => r.sectorId && sectNameMap[r.sectorId])
      .map(r => ({
        id: r.sectorId!,
        name: sectNameMap[r.sectorId!],
        total: r._count.id,
        critical: sectSevMap[r.sectorId!]?.["Critical"] || 0,
        high: sectSevMap[r.sectorId!]?.["High"] || 0,
        moderate: sectSevMap[r.sectorId!]?.["Moderate"] || 0,
        stable: sectSevMap[r.sectorId!]?.["Stable"] || 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── Province-specific detail (for provincial dashboard) ─────────────────
    let provincialDetail = null;
    if (access.isProvinceScoped && access.provinceId) {
      const [districts, recentActivity] = await Promise.all([
        prisma.district.findMany({
          where: { provinceId: access.provinceId },
          select: { id: true, name: true },
        }),
        prisma.case.findMany({
          where: { ...caseWhere },
          include: {
            district: { select: { name: true } },
            sector: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

      const byDistrictRaw = await prisma.case.groupBy({
        by: ["districtId"],
        where: caseWhere,
        _count: { id: true },
      });
      const distNameMap: Record<string, string> = {};
      for (const d of districts) distNameMap[d.id] = d.name;
      const casesByDistrict = byDistrictRaw
        .filter(r => r.districtId && distNameMap[r.districtId])
        .map(r => ({ name: distNameMap[r.districtId!], count: r._count.id }))
        .sort((a, b) => b.count - a.count);

      provincialDetail = { districts: casesByDistrict, recentActivity };
    }

    return NextResponse.json({
      scope: access.isProvinceScoped
        ? { provinceId: access.provinceId, provinceName: access.provinceName }
        : null,
      totalCases, bySeverity, resolvedCases, overdueCases, escalationsDueToday,
      casesByProvince, casesBySector, casesByStatus, recentCritical, provincialDetail,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
