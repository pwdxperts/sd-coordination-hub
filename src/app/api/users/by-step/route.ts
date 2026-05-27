import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Roles that operate nationally — NOT filtered by province
const NATIONAL_ROLES = new Set([
  "system_admin", "hub_intake", "hub_analyst",
  "national_director", "director_general", "minister", "admin",
]);

// Which roles are appropriate for each workflow step
const STEP_ROLES: Record<string, string[]> = {
  new_submission:     ["hub_intake", "hub_analyst", "system_admin"],
  under_verification: ["hub_intake", "hub_analyst", "system_admin"],
  classified:         ["hub_analyst", "system_admin"],
  assigned:           ["provincial_coordinator", "municipal_user", "hub_analyst", "system_admin"],
  action_plan:        ["municipal_user", "provincial_coordinator", "rapid_response", "system_admin"],
  intervention:       ["rapid_response", "municipal_user", "system_admin"],
  monitoring:         ["provincial_coordinator", "hub_analyst", "system_admin"],
  escalated:          ["national_director", "director_general", "system_admin"],
  resolved:           ["hub_analyst", "system_admin"],
};

// Descriptive label for what the step needs
const STEP_LABELS: Record<string, string> = {
  new_submission:     "Intake & Logging",
  under_verification: "Verification",
  classified:         "Classification",
  assigned:           "Case Coordination",
  action_plan:        "Action Plan Submission",
  intervention:       "On-ground Intervention",
  monitoring:         "Monitoring & Sign-off",
  escalated:          "Escalation Handling",
  resolved:           "Resolution & Closure",
};

// Next step in the workflow
const NEXT_STEP: Record<string, string> = {
  new_submission:     "under_verification",
  under_verification: "classified",
  classified:         "assigned",
  assigned:           "action_plan",
  action_plan:        "intervention",
  intervention:       "monitoring",
  monitoring:         "resolved",
  escalated:          "monitoring",
  resolved:           "resolved",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get("step") || "assigned";
  const province = searchParams.get("province");
  const useNext = searchParams.get("next") === "true";

  // If useNext, resolve the next step automatically
  const targetStep = useNext ? (NEXT_STEP[step] || step) : step;
  const roles = STEP_ROLES[targetStep] || ["hub_analyst", "system_admin"];

  // For each role, decide whether to filter by province:
  // - National roles: always return regardless of province
  // - Provincial roles: return users matching the province OR with no province set
  let users: any[] = [];

  for (const role of roles) {
    const isNational = NATIONAL_ROLES.has(role);
    const where: any = { active: true, role };

    if (!isNational && province) {
      // Provincial role: show users in this province OR unscoped users
      where.OR = [
        { province: province },
        { province: null },
        { province: "" },
      ];
    }
    // National roles: no province filter at all

    const roleUsers = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, province: true, department: true },
      orderBy: { name: "asc" },
    });
    users.push(...roleUsers);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  users = users.filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true; });
  users.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    users,
    step: targetStep,
    stepLabel: STEP_LABELS[targetStep] || targetStep,
    nextStep: NEXT_STEP[step],
    nextStepLabel: STEP_LABELS[NEXT_STEP[step]] || "",
    roles,
  });
}
