import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/auth";
import { getAccessContext, scopedCaseWhere, validateAssigneeForCase } from "@/lib/access";

// GET /api/cases - List cases with filters
export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get("provinceId");
    const sectorId = searchParams.get("sectorId");
    const severityLevel = searchParams.get("severityLevel");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (provinceId) where.provinceId = provinceId;
    if (sectorId) where.sectorId = sectorId;
    if (severityLevel) where.severityLevel = severityLevel;
    if (status) {
      const statuses = status.split(",").map((item) => item.trim()).filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where: scopedCaseWhere(access, where),
        include: {
          province: true,
          district: true,
          municipality: true,
          sector: true,
          failureCategory: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.case.count({ where: scopedCaseWhere(access, where) }),
    ]);

    return NextResponse.json({
      cases,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Cases GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const referenceNumber = generateReference();
    let targetProvinceId = body.provinceId || null;

    if (access.isProvinceScoped) {
      if (!access.provinceId) {
        return NextResponse.json({ error: "Your user is not linked to a province" }, { status: 403 });
      }

      if (targetProvinceId && targetProvinceId !== access.provinceId) {
        return NextResponse.json({ error: "You can only create cases in your province" }, { status: 403 });
      }

      targetProvinceId = access.provinceId;
    }

    const assigneeCheck = await validateAssigneeForCase(access, body.assignedToId, targetProvinceId);
    if (!assigneeCheck.ok) {
      return NextResponse.json({ error: assigneeCheck.error }, { status: 400 });
    }

    const newCase = await prisma.case.create({
      data: {
        referenceNumber,
        title: body.title,
        description: body.description || null,
        intakeChannel: body.intakeChannel || "manual",
        reporterName: body.reporterName || null,
        reporterContact: body.reporterContact || null,
        reporterType: body.reporterType || null,
        provinceId: targetProvinceId,
        districtId: body.districtId || null,
        municipalityId: body.municipalityId || null,
        ward: body.ward || null,
        sectorId: body.sectorId || null,
        failureCategoryId: body.failureCategoryId || null,
        subCategory: body.subCategory || null,
        severityScore: body.severityScore || 0,
        severityLevel: body.severityLevel || "Moderate",
        populationAffected: body.populationAffected || 0,
        publicSafetyRisk: body.publicSafetyRisk || false,
        isRecurring: body.isRecurring || false,
        status: "new_submission",
        assignedToId: body.assignedToId || null,
        ownerId: access.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        caseId: newCase.id,
        action: "CASE_CREATED",
        comment: `Case ${referenceNumber} created`,
        userId: access.user.id,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Cases POST error:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
