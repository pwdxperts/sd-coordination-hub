import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedToId = searchParams.get("assignedToId");
    const status = searchParams.get("status");
    const all = searchParams.get("all");

    const where: any = {};
    if (assignedToId) where.assignedToId = assignedToId;
    if (status && status !== "all") where.status = status;

    // If no specific user requested and not asking for all, scope to provided user
    // The frontend passes assignedToId from /api/auth/me so no cookie parsing needed
    if (!all && !assignedToId) {
      // Return empty — frontend must pass assignedToId from /api/auth/me
      where.assignedToId = "__no_user__";
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        nextAssignee: { select: { id: true, name: true, role: true } },
        case: { select: { id: true, referenceNumber: true, title: true, status: true, severityLevel: true, province: { select: { name: true } } } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, status, priority, category, assignedToId, createdById, caseId, dueDate, notes, nextStep, nextAssigneeId } = body;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || "pending",
        priority: priority || "medium",
        category: category || null,
        assignedToId: assignedToId || null,
        createdById: createdById || null,
        caseId: caseId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        nextStep: nextStep || null,
        nextAssigneeId: nextAssigneeId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        nextAssignee: { select: { id: true, name: true, role: true } },
        case: { select: { id: true, referenceNumber: true, title: true, status: true, severityLevel: true } },
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
