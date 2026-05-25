import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Intake Webhook
 * 
 * Receives WhatsApp messages and creates cases in the Intake Queue.
 * Designed to work with WhatsApp Business API webhooks.
 * 
 * Expected POST body:
 * {
 *   from: "+27XXXXXXXXX",
 *   fromName: "John Doe",
 *   message: "There's no water in Soweto for 3 days",
 *   timestamp: "2026-05-25T10:00:00Z",
 *   mediaUrl?: "https://...",
 *   mediaType?: "image" | "video" | "document" | "audio",
 *   location?: { latitude: -26.2, longitude: 28.0, name: "Soweto" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, fromName, message, timestamp, mediaUrl, mediaType, location } = body;

    if (!from || !message) {
      return NextResponse.json({ error: "Missing required fields: from, message" }, { status: 400 });
    }

    // Generate reference number
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `NSDCH-${year}-${random}`;

    // Text analysis for classification
    const textContent = message.toLowerCase();

    // Province detection
    const provinceMap: Record<string, string> = {
      "eastern cape": "Eastern Cape", "free state": "Free State", "gauteng": "Gauteng",
      "kwazulu-natal": "KwaZulu-Natal", "kzn": "KwaZulu-Natal", "limpopo": "Limpopo",
      "mpumalanga": "Mpumalanga", "north west": "North West", "northern cape": "Northern Cape",
      "western cape": "Western Cape",
    };
    // Also check city/area to province mapping
    const areaToProvince: Record<string, string> = {
      "johannesburg": "Gauteng", "joburg": "Gauteng", "pretoria": "Gauteng", "tshwane": "Gauteng",
      "ekurhuleni": "Gauteng", "soweto": "Gauteng", "alexandra": "Gauteng", "soshanguve": "Gauteng",
      "durban": "KwaZulu-Natal", "ethekwini": "KwaZulu-Natal", "pietermaritzburg": "KwaZulu-Natal",
      "cape town": "Western Cape", "khayelitsha": "Western Cape",
      "bloemfontein": "Free State", "mangaung": "Free State",
      "polokwane": "Limpopo", "thohoyandou": "Limpopo",
      "mbombela": "Mpumalanga", "nelspruit": "Mpumalanga",
      "mahikeng": "North West", "rustenburg": "North West",
      "kimberley": "Northern Cape",
      "gqeberha": "Eastern Cape", "port elizabeth": "Eastern Cape", "east london": "Eastern Cape",
    };

    let detectedProvince: string | null = null;
    for (const [key, province] of Object.entries(provinceMap)) {
      if (textContent.includes(key)) { detectedProvince = province; break; }
    }
    if (!detectedProvince) {
      for (const [area, province] of Object.entries(areaToProvince)) {
        if (textContent.includes(area)) { detectedProvince = province; break; }
      }
    }

    // Sector detection
    const sectorKeywords: Record<string, string[]> = {
      "Water Services": ["water", "sewage", "sanitation", "pump", "dam", "burst pipe", "no water", "tap", "drainage", "toilet"],
      "Electricity Supply": ["electricity", "power", "substation", "outage", "load shedding", "cable", "transformer", "no power", "eskom", "meter", "lights"],
      "Waste Management": ["waste", "rubbish", "refuse", "landfill", "dump", "garbage", "collection", "bin", "skip", "rubbish"],
      "Roads & Transport": ["road", "pothole", "bridge", "pavement", "sidewalk", "transport", "taxi", "bus", "traffic", "speed bump"],
      "Governance": ["governance", "corruption", "tender", "budget", "audit", "council", "municipality", "section 139", "administrator"],
      "Human Settlements": ["housing", "shack", "informal settlement", "rdp house", "building", "flat", "room"],
      "Environment": ["environment", "pollution", "drought", "flood", "fire", "mining", "dumping", "chemical"],
    };

    let detectedSector: string | null = null;
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(kw => textContent.includes(kw))) {
        detectedSector = sector;
        break;
      }
    }

    // Severity scoring
    let severityScore = 30;
    const criticalKw = ["urgent", "emergency", "critical", "crisis", "danger", "death", "injury", "collapsed", "explosion", "fire", "flood"];
    const highKw = ["days", "week", "weeks", "no water", "no power", "no electricity", "outage", "protest", "strike", "blocked", "broken", "collapsed"];

    if (criticalKw.some(kw => textContent.includes(kw))) severityScore += 45;
    else if (highKw.some(kw => textContent.includes(kw))) severityScore += 25;

    // Duration detection
    const durationMatch = textContent.match(/(\d+)\s*(day|week|month)/);
    const durationDays = durationMatch
      ? parseInt(durationMatch[1]) * (durationMatch[2].startsWith("week") ? 7 : durationMatch[2].startsWith("month") ? 30 : 1)
      : 0;
    if (durationDays > 7) severityScore += 10;
    if (durationDays > 30) severityScore += 10;

    severityScore = Math.min(severityScore, 100);
    const severityLevel = severityScore >= 85 ? "Critical"
      : severityScore >= 60 ? "High"
      : severityScore >= 35 ? "Moderate"
      : "Stable";

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        referenceNumber,
        title: message.substring(0, 200),
        description: message.substring(0, 5000),
        intakeChannel: "whatsapp",
        reporterName: fromName || from,
        reporterContact: from,
        reporterType: "public",
        dateReceived: timestamp ? new Date(timestamp) : new Date(),
        severityScore,
        severityLevel,
        status: "new_submission",
        escalationLevel: "none",
        publicSafetyRisk: criticalKw.some(kw => textContent.includes(kw)),
        isRecurring: false,
        protestMediaFlag: ["protest", "strike", "march", "toyitoyi", "toyi-toyi"].some(kw => textContent.includes(kw)),
        durationDays,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        ward: location?.name || null,
      },
    });

    // Link province
    if (detectedProvince) {
      const province = await prisma.province.findFirst({
        where: { name: { contains: detectedProvince, mode: "insensitive" } },
      });
      if (province) {
        await prisma.case.update({ where: { id: newCase.id }, data: { provinceId: province.id } });
      }
    }

    // Link sector
    if (detectedSector) {
      const sector = await prisma.sector.findFirst({
        where: { name: { contains: detectedSector, mode: "insensitive" } },
      });
      if (sector) {
        await prisma.case.update({ where: { id: newCase.id }, data: { sectorId: sector.id } });
      }
    }

    // Save media as evidence
    if (mediaUrl) {
      await prisma.evidence.create({
        data: {
          caseId: newCase.id,
          fileName: mediaType ? `whatsapp_${mediaType}_${Date.now()}` : "whatsapp_media",
          fileUrl: mediaUrl,
          fileType: mediaType || "image",
          uploadedBy: from,
          description: `WhatsApp ${mediaType || "media"} from ${fromName || from}`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        caseId: newCase.id,
        action: "case_created",
        
        comment: `Case created from WhatsApp. Sender: ${fromName || from} (${from})`,
      },
    });

    // Return reference number for auto-reply
    return NextResponse.json({
      success: true,
      autoReply: `Thank you for reporting this issue. Your case has been logged.\n\nReference: ${referenceNumber}\nSeverity: ${severityLevel}\n\nThe Hub team will review and verify your report. You can track your case using the reference number above.\n\n- National Service Delivery Coordination Hub`,
      case: {
        id: newCase.id,
        referenceNumber,
        severityLevel,
        status: newCase.status,
      },
      detected: {
        province: detectedProvince,
        sector: detectedSector,
        severityScore,
        durationDays,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("WhatsApp intake error:", error);
    return NextResponse.json({ error: "Failed to create case", details: error.message }, { status: 500 });
  }
}