import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Social Media Scraper Intake
 * 
 * Receives scraped social media posts and creates cases.
 * Can be called by a cron job or external scraper.
 * 
 * Expected POST body:
 * {
 *   source: "twitter" | "facebook" | "instagram" | "tiktok",
 *   postId: "1234567890",
 *   author: "@username" | "User Name",
 *   content: "No water in Soweto for 3 days @COGTA @DWSSA",
 *   timestamp: "2026-05-25T10:00:00Z",
 *   url: "https://twitter.com/user/status/123",
 *   mediaUrls?: ["https://..."],
 *   location?: { name: "Soweto", province: "Gauteng" },
 *   metrics?: { likes: 50, retweets: 10, replies: 5 }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, postId, author, content, timestamp, url, mediaUrls, location, metrics } = body;

    if (!content || !source) {
      return NextResponse.json({ error: "Missing required fields: source, content" }, { status: 400 });
    }

    // Check for duplicate (same post ID)
    if (postId) {
      const existing = await prisma.case.findFirst({
        where: { 
          description: { contains: postId },
          intakeChannel: `social_${source}`,
        },
      });
      if (existing) {
        return NextResponse.json({ message: "Already ingested", caseId: existing.id, referenceNumber: existing.referenceNumber });
      }
    }

    // Generate reference number
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceNumber = `NSDCH-${year}-${random}`;

    const textContent = content.toLowerCase();

    // Province detection (same logic as WhatsApp)
    const areaToProvince: Record<string, string> = {
      "johannesburg": "Gauteng", "joburg": "Gauteng", "pretoria": "Gauteng", "tshwane": "Gauteng",
      "ekurhuleni": "Gauteng", "soweto": "Gauteng", "alexandra": "Gauteng",
      "durban": "KwaZulu-Natal", "ethekwini": "KwaZulu-Natal", "pietermaritzburg": "KwaZulu-Natal",
      "cape town": "Western Cape", "khayelitsha": "Western Cape",
      "bloemfontein": "Free State", "mangaung": "Free State",
      "polokwane": "Limpopo", "mbombela": "Mpumalanga", "nelspruit": "Mpumalanga",
      "mahikeng": "North West", "rustenburg": "North West",
      "kimberley": "Northern Cape", "gqeberha": "Eastern Cape", "port elizabeth": "Eastern Cape",
    };

    let detectedProvince = location?.province || null;
    if (!detectedProvince) {
      for (const [area, province] of Object.entries(areaToProvince)) {
        if (textContent.includes(area)) { detectedProvince = province; break; }
      }
    }

    // Sector detection
    const sectorKeywords: Record<string, string[]> = {
      "Water Services": ["water", "sewage", "sanitation", "pump", "dam", "burst pipe", "no water", "tap", "blue drop", "green drop"],
      "Electricity Supply": ["electricity", "power", "substation", "outage", "load shedding", "cable", "transformer", "no power", "eskom", "meter"],
      "Waste Management": ["waste", "rubbish", "refuse", "landfill", "dump", "garbage", "collection"],
      "Roads & Transport": ["road", "pothole", "bridge", "pavement", "transport", "taxi", "bus"],
      "Governance": ["governance", "corruption", "tender", "budget", "audit", "council", "section 139"],
      "Human Settlements": ["housing", "shack", "informal settlement", "rdp house"],
      "Environment": ["environment", "pollution", "drought", "flood", "fire", "mining", "dumping"],
    };

    let detectedSector: string | null = null;
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(kw => textContent.includes(kw))) {
        detectedSector = sector;
        break;
      }
    }

    // Severity scoring — social media gets bonus for engagement (indicates wider impact)
    let severityScore = 25;
    const criticalKw = ["urgent", "emergency", "critical", "crisis", "danger", "death", "injury", "collapsed", "explosion", "fire"];
    const highKw = ["days", "week", "weeks", "no water", "no power", "outage", "protest", "strike", "blocked"];

    if (criticalKw.some(kw => textContent.includes(kw))) severityScore += 40;
    else if (highKw.some(kw => textContent.includes(kw))) severityScore += 20;

    // Engagement bonus — high engagement suggests wider community impact
    if (metrics) {
      const totalEngagement = (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
      if (totalEngagement > 100) severityScore += 15;
      else if (totalEngagement > 50) severityScore += 10;
      else if (totalEngagement > 20) severityScore += 5;
    }

    severityScore = Math.min(severityScore, 100);
    const severityLevel = severityScore >= 85 ? "Critical"
      : severityScore >= 60 ? "High"
      : severityScore >= 35 ? "Moderate"
      : "Stable";

    // Build title from content
    const title = content.length > 200 ? content.substring(0, 197) + "..." : content;

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        referenceNumber,
        title,
        description: `${content}\n\n---\nSource: ${source} | Post ID: ${postId || "N/A"} | Author: ${author}\nURL: ${url || "N/A"}${metrics ? `\nEngagement: ${metrics.likes || 0} likes, ${metrics.retweets || 0} shares, ${metrics.replies || 0} replies` : ""}`,
        intakeChannel: `social_${source}`,
        reporterName: author || "Social Media User",
        reporterContact: url || author || source,
        reporterType: "other",
        dateReceived: timestamp ? new Date(timestamp) : new Date(),
        severityScore,
        severityLevel,
        status: "new_submission",
        escalationLevel: "none",
        publicSafetyRisk: criticalKw.some(kw => textContent.includes(kw)),
        isRecurring: false,
        protestMediaFlag: ["protest", "strike", "march", "toyitoyi"].some(kw => textContent.includes(kw)),
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
    if (mediaUrls && Array.isArray(mediaUrls)) {
      for (let i = 0; i < mediaUrls.length; i++) {
        await prisma.evidence.create({
          data: {
            caseId: newCase.id,
            fileName: `social_${source}_media_${i + 1}`,
            fileUrl: mediaUrls[i],
            fileType: "image",
            uploadedBy: author || source,
            description: `${source} media from post by ${author}`,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        caseId: newCase.id,
        action: "case_created",
        
        comment: `Case created from ${source} social media scrape. Author: ${author}. Post: ${postId || url || "N/A"}`,
      },
    });

    return NextResponse.json({
      success: true,
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
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("Social media intake error:", error);
    return NextResponse.json({ error: "Failed to create case from social media", details: error.message }, { status: 500 });
  }
}