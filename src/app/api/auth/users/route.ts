import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, department: true,
        active: true, province: true, municipality: true, lastLogin: true, createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, name, email, role, department, province, municipality, active, newPassword } = body;

    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    if (action === "deactivate" || action === "activate") {
      const user = await prisma.user.update({
        where: { id },
        data: { active: action === "activate" },
        select: { id: true, name: true, email: true, role: true, active: true, department: true },
      });
      return NextResponse.json({ user });
    }

    if (action === "reset_password") {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id }, data: { password: hashed, loginAttempts: 0, lockedUntil: null } });
      return NextResponse.json({ success: true });
    }

    // Default: edit user fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (province !== undefined) updateData.province = province;
    if (municipality !== undefined) updateData.municipality = municipality;
    if (active !== undefined) updateData.active = active;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, department: true, province: true, active: true },
    });
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
