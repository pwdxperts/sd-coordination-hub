import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evidence = await prisma.evidence.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ evidence });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { fileName, fileUrl, fileType, fileSize, description } = body;

    if (!fileName || !fileUrl) return NextResponse.json({ error: "fileName and fileUrl required" }, { status: 400 });

    const evidence = await prisma.evidence.create({
      data: {
        caseId: id,
        fileName,
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize || null,
        uploadedBy: access.user.name,
        description: description || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        caseId: id,
        action: "evidence_uploaded",
        userId: access.user.id,
        comment: `Evidence uploaded: ${fileName}`,
      },
    });

    return NextResponse.json({ evidence });
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload evidence" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const evidenceId = searchParams.get("evidenceId");
  if (!evidenceId) return NextResponse.json({ error: "evidenceId required" }, { status: 400 });
  await prisma.evidence.delete({ where: { id: evidenceId } });
  return NextResponse.json({ success: true });
}
