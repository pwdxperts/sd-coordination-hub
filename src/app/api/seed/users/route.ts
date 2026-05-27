import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const WORKFLOW_USERS = [
  { name: "Pride Dube", email: "pride@pwdxperts.co.za", role: "system_admin", province: "", department: "PWD Xperts" },
  { name: "Peter Williams", email: "peter@cogta.gov.za", role: "system_admin", province: "", department: "CoGTA National" },
  { name: "Thabo Sithole", email: "intake@cogta.gov.za", role: "hub_intake", province: "", department: "CoGTA Hub Intake" },
  { name: "Nomsa Dlamini", email: "intake2@cogta.gov.za", role: "hub_intake", province: "", department: "CoGTA Hub Intake" },
  { name: "James Molefe", email: "analyst@cogta.gov.za", role: "hub_analyst", province: "", department: "CoGTA Hub Analytics" },
  { name: "Sarah Nkosi", email: "senior.analyst@cogta.gov.za", role: "hub_analyst", province: "", department: "CoGTA Hub Analytics" },
  { name: "Gauteng Coordinator", email: "gauteng@cogta.gov.za", role: "provincial_coordinator", province: "Gauteng", department: "CoGTA Gauteng" },
  { name: "KwaZulu-Natal Coordinator", email: "kwazulunatal@cogta.gov.za", role: "provincial_coordinator", province: "KwaZulu-Natal", department: "CoGTA KZN" },
  { name: "Eastern Cape Coordinator", email: "easterncape@cogta.gov.za", role: "provincial_coordinator", province: "Eastern Cape", department: "CoGTA EC" },
  { name: "Free State Coordinator", email: "freestate@cogta.gov.za", role: "provincial_coordinator", province: "Free State", department: "CoGTA FS" },
  { name: "Limpopo Coordinator", email: "limpopo@cogta.gov.za", role: "provincial_coordinator", province: "Limpopo", department: "CoGTA LP" },
  { name: "Mpumalanga Coordinator", email: "mpumalanga@cogta.gov.za", role: "provincial_coordinator", province: "Mpumalanga", department: "CoGTA MP" },
  { name: "North West Coordinator", email: "northwest@cogta.gov.za", role: "provincial_coordinator", province: "North West", department: "CoGTA NW" },
  { name: "Northern Cape Coordinator", email: "northerncape@cogta.gov.za", role: "provincial_coordinator", province: "Northern Cape", department: "CoGTA NC" },
  { name: "Thandi Ndlovu", email: "monitor@cogta.gov.za", role: "provincial_coordinator", province: "Gauteng", department: "CoGTA Gauteng Monitoring" },
  { name: "Sipho Zulu", email: "municipal.gp@cogta.gov.za", role: "municipal_user", province: "Gauteng", department: "City of Tshwane" },
  { name: "Zanele Mokoena", email: "municipal.kzn@cogta.gov.za", role: "municipal_user", province: "KwaZulu-Natal", department: "eThekwini Metro" },
  { name: "Bongani Khumalo", email: "rapid1@cogta.gov.za", role: "rapid_response", province: "", department: "Rapid Response Unit" },
  { name: "Lindiwe Dube", email: "rapid2@cogta.gov.za", role: "rapid_response", province: "", department: "Rapid Response Unit" },
  { name: "Director Williams", email: "director@cogta.gov.za", role: "national_director", province: "", department: "CoGTA National Director" },
];

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-seed-secret");
  if (secret !== "CoGTA-seed-2026") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hash = await bcrypt.hash("CoGTA2026!", 10);
  const results = [];
  for (const u of WORKFLOW_USERS) {
    try {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role, province: u.province || null, department: u.department || null, active: true },
        create: {
          name: u.name, email: u.email, password: hash,
          role: u.role, province: u.province || null,
          department: u.department || null, active: true,
        },
      });
      results.push({ email: u.email, status: "ok" });
    } catch (e: any) {
      results.push({ email: u.email, status: "error", error: e.message });
    }
  }
  return NextResponse.json({ success: true, users: results });
}

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, province: true, active: true },
    orderBy: { role: "asc" },
  });
  return NextResponse.json({ users, count: users.length });
}
