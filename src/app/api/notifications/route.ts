import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ notifications: [], count: 0 });

    const notifications = await prisma.notification.findMany({
      where: { userId: access.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    return NextResponse.json({ notifications, count: unreadCount });
  } catch {
    return NextResponse.json({ notifications: [], count: 0 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: access.user.id, read: false },
        data: { read: true },
      });
    } else if (id) {
      await prisma.notification.update({ where: { id }, data: { read: true } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
