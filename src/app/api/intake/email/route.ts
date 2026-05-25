import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Email Intake Webhook
 * 
 * Receives parsed email data and creates a new case in the Intake Queue.
 * 
 * Expected POST body:
 * {
 *   from: "sender@email.com",
 *   fromName: "John Doe",
 *   subject: "No water in Soweto",
 *   body: "We have had no water for 3 days...",
 *   date: "2026-05-25T10:00:00Z",
 *   attachments?: [{ fileName, fileUrl, fileType, fileSize }],
 *   source?: "email" | "whatsapp" | "social_twitter" | "social_facebook" | "manual"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, fromName, subject, body: emailBody, date, attachments, source = "email" } = body;

    if (!from || !subject) {
      return NextResponse.json({ error: "Missing required fields: from, subject" }, { status: 400 });
    }

    // Generate reference number
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `NSDCH-${year}-${random}`;

    // Try to extract province from subject/body
    const SA_PROVINCES = [
      "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
      "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
      "Eastern Cape", "KZN", "North West",
    ];
    const textContent = `${subject} ${emailBody}`.toLowerCase();
    const detectedProvince = SA_PROVINCES.find(p => textContent.includes(p.toLowerCase())) || null;

    // Try to extract sector
    const SECTOR_KEYWORDS: Record<string, string[]> = {
      "Water Services": ["water", "sewage", "sanitation", "pump", "dam", "river", "burst pipe", "no water"],
      "Electricity Supply": ["electricity", "power", "substation", "outage", "load shedding", "cable", "transformer", "no power"],
      "Waste Management": ["waste", "rubbish", "refuse", "landfill", "dump", "garbage", "refuse collection"],
      "Roads & Transport": ["road", "pothole", "bridge", "pavement", "sidewalk", "transport", "taxi"],
      "Governance": ["governance", "corruption", "tender", "budget", "audit", "council", "municipality", "section 139"],
      "Human Settlements": ["housing", "shack", "informal settlement", "RDP house", "sanitation", "toilet"],
      "Environment": ["environment", "pollution", "drought", "flood", "fire", "mining", "dumping"],
    };

    let detectedSector: string | null = null;
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      if (keywords.some(kw => textContent.includes(kw))) {
        detectedSector = sector;
        break;
      }
    }

    // Calculate initial severity score
    let severityScore = 30; // base
    const criticalKeywords = ["urgent", "emergency", "critical", "crisis", "danger", "safety", "death", "injury", "collapsed", "explosion"];
    const highKeywords = ["days", "week", "weeks", "no water", "no power", "no electricity", "outage", "protest", "strike", "blocked"];
    
    if (criticalKeywords.some(kw => textContent.includes(kw))) severityScore += 40;
    else if (highKeywords.some(kw => textContent.includes(kw))) severityScore += 20;

    const severityLevel = severityScore >= 85 ? "Critical"
      : severityScore >= 60 ? "High"
      : severityScore >= 35 ? "Moderate"
      : "Stable";

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        referenceNumber,
        title: subject.substring(0, 200),
        description: emailBody ? emailBody.substring(0, 5000) : null,
        intakeChannel: source,
        reporterName: fromName || from,
        reporterContact: from,
        reporterType: source === "email" ? "public" : source === "whatsapp" ? "public" : "other",
        dateReceived: date ? new Date(date) : new Date(),
        severityScore,
        severityLevel,
        status: "new_submission",
        escalationLevel: "none",
        publicSafetyRisk: criticalKeywords.some(kw => textContent.includes(kw)),
        isRecurring: false,
        protestMediaFlag: ["protest", "strike", "march", "toyitoyi", "toyi-toyi"].some(kw => textContent.includes(kw)),
      },
    });

    // Try to link province if detected
    if (detectedProvince) {
      const province = await prisma.province.findFirst({
        where: { name: { contains: detectedProvince, mode: "insensitive" } },
      });
      if (province) {
        await prisma.case.update({
          where: { id: newCase.id },
          data: { provinceId: province.id },
        });
      }
    }

    // Try to link sector if detected
    if (detectedSector) {
      const sector = await prisma.sector.findFirst({
        where: { name: { contains: detectedSector, mode: "insensitive" } },
      });
      if (sector) {
        await prisma.case.update({
          where: { id: newCase.id },
          data: { sectorId: sector.id },
        });
      }
    }

    // Save attachments as evidence
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        await prisma.evidence.create({
          data: {
            caseId: newCase.id,
            fileName: attachment.fileName || "attachment",
            fileUrl: attachment.fileUrl || "",
            fileType: attachment.fileType || "unknown",
            fileSize: attachment.fileSize || null,
            uploadedBy: from,
            description: `Email attachment from ${from}`,
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        caseId: newCase.id,
        action: "case_created",
        
        comment: `Case created from ${source} intake. Sender: ${fromName || from}`,
      },
    });

    return NextResponse.json({
      success: true,
      case: {
        id: newCase.id,
        referenceNumber: newCase.referenceNumber,
        title: newCase.title,
        severityLevel: newCase.severityLevel,
        status: newCase.status,
      },
      detected: {
        province: detectedProvince,
        sector: detectedSector,
        severityScore,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Email intake error:", error);
    return NextResponse.json({ error: "Failed to create case from intake", details: error.message }, { status: 500 });
  }
}