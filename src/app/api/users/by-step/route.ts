import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STEP_ROLES: Record<string, string[]> = {
  new_submission:     ["hub_intake", "hub_analyst", "system_admin"],
  under_verification: ["hub_intake", "hub_analyst", "system_admin"],
  classified:         ["hub_analyst", "system_admin"],
  assigned:           ["provincial_coordinator", "hub_analyst", "system_admin"],
  action_plan:        ["municipal_user", "provincial_coordinator", "system_admin"],
  intervention:       ["rapid_response", "municipal_user", "system_admin"],
  monitoring:         ["provincial_coordinator", "hub_analyst", "system_admin"],
  escalated:          ["national_director", "director_general", "system_admin"],
  resolved:           ["hub_analyst", "system_admin"],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step") || "assigned";
  const province = searchParams.get("province");

  const roles = STEP_ROLES[step] || ["hub_analyst", "system_admin"];

  const where: any = { active: true, role: { in: roles } };
  if (province) where.province = province;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, province: true, department: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ users, roles });
}
