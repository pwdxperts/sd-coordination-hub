import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseIsInScope, getAccessContext } from "@/lib/access";

const PROVINCIAL_ASSIGNABLE_ROLES = [
  "provincial_coordinator",
  "municipal_user",
  "sector_user",
  "rapid_response",
];

const NATIONAL_ASSIGNABLE_ROLES = [
  "system_admin",
  "hub_analyst",
  "provincial_coordinator",
  "municipal_user",
  "sector_user",
  "rapid_response",
  "admin",
];

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const caseId = request.nextUrl.searchParams.get("caseId");
    const provinceId = request.nextUrl.searchParams.get("provinceId");
    let caseProvinceName: string | null = null;

    if (caseId) {
      const caseRecord = await prisma.case.findUnique({
        where: { id: caseId },
        select: {
          provinceId: true,
          province: { select: { name: true } },
        },
      });

      if (!caseRecord || !caseIsInScope(access, caseRecord.provinceId)) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      caseProvinceName = caseRecord.province?.name || null;
    } else if (provinceId) {
      const province = await prisma.province.findUnique({
        where: { id: provinceId },
        select: { name: true },
      });
      caseProvinceName = province?.name || null;
    }

    if (access.isProvinceScoped) {
      if (!access.provinceName) {
        return NextResponse.json({ users: [], scope: null });
      }

      const users = await prisma.user.findMany({
        where: {
          active: true,
          province: access.provinceName,
          role: { in: PROVINCIAL_ASSIGNABLE_ROLES },
        },
        select: { id: true, name: true, email: true, role: true, department: true, province: true },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        users,
        scope: { provinceName: access.provinceName, provinceId: access.provinceId },
      });
    }

    const where: any = {
      active: true,
      role: { in: NATIONAL_ASSIGNABLE_ROLES },
    };

    if (caseProvinceName) {
      where.OR = [
        { province: caseProvinceName },
        { province: null },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, department: true, province: true },
      orderBy: [{ province: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      users,
      scope: caseProvinceName ? { provinceName: caseProvinceName } : null,
    });
  } catch (error) {
    console.error("Assignable users error:", error);
    return NextResponse.json(
      { error: "Failed to load assignable users" },
      { status: 500 }
    );
  }
}
