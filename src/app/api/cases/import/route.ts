import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";

// Helper to find or create a sector by name
async function findSector(name: string) {
  if (!name) return null;
  const n = name.trim();
  let s = await prisma.sector.findFirst({ where: { name: { contains: n, mode: "insensitive" } } });
  if (!s) s = await prisma.sector.create({ data: { name: n, description: n } });
  return s;
}

// Helper to find province by name
async function findProvince(name: string) {
  if (!name) return null;
  return prisma.province.findFirst({ where: { name: { contains: name.trim(), mode: "insensitive" } } });
}

// Map severity aliases to standard values
function normaliseSeverity(val: string): string {
  const v = (val || "").toLowerCase().trim();
  if (v.includes("critical") || v === "1") return "Critical";
  if (v.includes("high") || v === "2") return "High";
  if (v.includes("stable") || v.includes("low") || v === "4") return "Stable";
  return "Moderate";
}

// Map channel aliases
function normaliseChannel(val: string): string {
  const v = (val || "").toLowerCase().trim();
  if (v.includes("whatsapp")) return "whatsapp";
  if (v.includes("email")) return "email";
  if (v.includes("social")) return "social_media";
  if (v.includes("public") || v.includes("portal")) return "public";
  if (v.includes("municipal")) return "municipal_report";
  return "manual";
}

// Generate reference number
async function nextRef(provinceCode: string) {
  const count = await prisma.case.count();
  return `${provinceCode || "SD"}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    if (!access) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { rows } = body; // Array of row objects from parsed Excel/CSV

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const results: { row: number; status: "created" | "skipped" | "error"; ref?: string; reason?: string }[] = [];
    let created = 0, skipped = 0, errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Normalise field names — handle many common column header variations
        const title = (row.title || row.Title || row.TITLE || row.issue || row.Issue || row.description || row.Description || "").toString().trim();
        const provinceName = (row.province || row.Province || row.PROVINCE || "").toString().trim();
        const districtName = (row.district || row.District || row.DISTRICT || "").toString().trim();
        const municipalityName = (row.municipality || row.Municipality || row.MUNICIPALITY || row.local_municipality || "").toString().trim();
        const ward = (row.ward || row.Ward || row.WARD || "").toString().trim();
        const sectorName = (row.sector || row.Sector || row.SECTOR || row.service || row.Service || "").toString().trim();
        const severity = normaliseSeverity((row.severity || row.Severity || row.priority || row.Priority || "Moderate").toString());
        const channel = normaliseChannel((row.channel || row.Channel || row.intake_channel || row.source || "manual").toString());
        const reporterName = (row.reporter || row.Reporter || row.reporter_name || row.ReporterName || row.contact || "").toString().trim();
        const contactDetails = (row.contact || row.Contact || row.contact_details || row.phone || row.email || "").toString().trim();
        const incomingRef = (row.reference || row.Reference || row.ref || row.Ref || row.case_number || "").toString().trim();
        const descriptionExtra = (row.description || row.Description || row.notes || row.Notes || row.details || "").toString().trim();

        if (!title) { results.push({ row: i+1, status: "skipped", reason: "No title / issue description" }); skipped++; continue; }

        // Skip duplicate by reference number
        if (incomingRef) {
          const existing = await prisma.case.findFirst({ where: { referenceNumber: incomingRef } });
          if (existing) { results.push({ row: i+1, status: "skipped", ref: incomingRef, reason: `Duplicate reference: ${incomingRef}` }); skipped++; continue; }
        }

        // Skip near-duplicate by title + province
        const province = await findProvince(provinceName);
        const dupCheck = await prisma.case.findFirst({
          where: { title: { equals: title, mode: "insensitive" }, ...(province ? { provinceId: province.id } : {}) }
        });
        if (dupCheck) { results.push({ row: i+1, status: "skipped", ref: dupCheck.referenceNumber, reason: `Near-duplicate: same title in ${provinceName || "unknown province"}` }); skipped++; continue; }

        // Find sector
        const sector = sectorName ? await findSector(sectorName) : null;

        // Find district and municipality
        const district = districtName ? await prisma.district.findFirst({ where: { name: { contains: districtName, mode: "insensitive" } } }) : null;
        const municipality = municipalityName ? await prisma.municipality.findFirst({ where: { name: { contains: municipalityName, mode: "insensitive" } } }) : null;

        // Generate reference
        const provinceCode = province?.name?.match(/\b[A-Z]{2,3}\b/)?.[0] || 
          (province?.name ? province.name.substring(0,2).toUpperCase() : "SD");
        const refNum = incomingRef || await nextRef(provinceCode);

        await prisma.case.create({
          data: {
            referenceNumber: refNum,
            title: title.substring(0, 255),
            description: descriptionExtra || title,
            status: "new_submission",
            severityLevel: severity,
            intakeChannel: channel,
            reporterName: reporterName || null,
            contactDetails: contactDetails || null,
            ward: ward || null,
            provinceId: province?.id || null,
            districtId: district?.id || null,
            municipalityId: municipality?.id || null,
            sectorId: sector?.id || null,
          }
        });
        results.push({ row: i+1, status: "created", ref: refNum });
        created++;
      } catch (e: any) {
        results.push({ row: i+1, status: "error", reason: e.message?.substring(0, 100) });
        errors++;
      }
    }

    return NextResponse.json({ success: true, summary: { total: rows.length, created, skipped, errors }, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}
