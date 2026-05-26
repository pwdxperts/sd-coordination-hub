import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();
    const result: Record<string, string | null> = {};
    for (const c of configs) result[c.key] = c.value;
    return NextResponse.json({ config: result });
  } catch (error) {
    return NextResponse.json({ config: {} });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updates = Object.entries(body);
    await Promise.all(
      updates.map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value: value as string },
          create: { key, value: value as string },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
