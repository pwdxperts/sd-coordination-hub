import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        nextAssignee: { select: { id: true, name: true, role: true } },
        case: { select: { id: true, referenceNumber: true, title: true } },
      },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, category, assignedToId, caseId, dueDate, notes, nextStep, nextAssigneeId, completedAt } = body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) {
      data.status = status;
      if (status === "completed" && !completedAt) data.completedAt = new Date();
      if (status !== "completed") data.completedAt = null;
    }
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (caseId !== undefined) data.caseId = caseId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) data.notes = notes;
    if (nextStep !== undefined) data.nextStep = nextStep;
    if (nextAssigneeId !== undefined) data.nextAssigneeId = nextAssigneeId || null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        nextAssignee: { select: { id: true, name: true, role: true } },
        case: { select: { id: true, referenceNumber: true, title: true } },
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
