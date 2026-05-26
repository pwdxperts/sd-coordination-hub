import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { responseTimeHours, resolutionDays, escalationAfterHours, description } = body;
    const data: any = {};
    if (responseTimeHours !== undefined) data.responseTimeHours = Number(responseTimeHours);
    if (resolutionDays !== undefined) data.resolutionDays = Number(resolutionDays);
    if (escalationAfterHours !== undefined) data.escalationAfterHours = Number(escalationAfterHours);
    if (description !== undefined) data.description = description;
    const sla = await prisma.slaConfig.update({ where: { id }, data });
    return NextResponse.json({ sla });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update SLA config" }, { status: 500 });
  }
}
