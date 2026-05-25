import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { AuthUser, getUserById, parseSessionCookie } from "./auth";

const PROVINCE_SCOPED_ROLES = new Set(["provincial_coordinator"]);

export type AccessContext = {
  user: AuthUser;
  isProvinceScoped: boolean;
  provinceId: string | null;
  provinceName: string | null;
};

export async function getAccessContext(request: NextRequest): Promise<AccessContext | null> {
  const session = parseSessionCookie(request.cookies.get("session")?.value);
  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  const isProvinceScoped = PROVINCE_SCOPED_ROLES.has(user.role);
  if (!isProvinceScoped) {
    return { user, isProvinceScoped, provinceId: null, provinceName: null };
  }

  if (!user.province) {
    return { user, isProvinceScoped, provinceId: null, provinceName: null };
  }

  const province = await prisma.province.findFirst({
    where: { name: { equals: user.province, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  return {
    user,
    isProvinceScoped,
    provinceId: province?.id || null,
    provinceName: province?.name || user.province,
  };
}

export function scopedCaseWhere(access: AccessContext, where: Record<string, any> = {}) {
  if (!access.isProvinceScoped) return where;
  return {
    ...where,
    provinceId: access.provinceId || "__no_province_scope__",
  };
}

export function caseIsInScope(access: AccessContext, provinceId?: string | null) {
  if (!access.isProvinceScoped) return true;
  return Boolean(access.provinceId && provinceId === access.provinceId);
}

export async function validateAssigneeForCase(
  access: AccessContext,
  assignedToId: string | null | undefined,
  caseProvinceId: string | null
) {
  if (!assignedToId) return { ok: true as const, user: null };

  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true, name: true, email: true, role: true, province: true, active: true },
  });

  if (!assignee || !assignee.active) {
    return { ok: false as const, error: "Selected assignee is not active" };
  }

  if (access.isProvinceScoped) {
    if (!caseIsInScope(access, caseProvinceId)) {
      return { ok: false as const, error: "You can only assign cases in your province" };
    }

    if (assignee.province !== access.provinceName) {
      return { ok: false as const, error: "Select an assignee from your province" };
    }
  } else if (caseProvinceId && assignee.province) {
    const caseProvince = await prisma.province.findUnique({
      where: { id: caseProvinceId },
      select: { name: true },
    });

    if (caseProvince?.name && assignee.province !== caseProvince.name) {
      return { ok: false as const, error: "Select an assignee from the case province" };
    }
  }

  return { ok: true as const, user: assignee };
}
