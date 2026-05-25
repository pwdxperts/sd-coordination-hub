import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("Starting seed...");

    // ─── PROVINCES ──────────────────────────────────────
    const provinceData = [
      {
        name: "Eastern Cape",
        districts: [
          {
            name: "Alfred Nzo District",
            municipalities: ["Umzimvubu", "Matatiele", "Mbizana", "Ntabankulu"],
          },
          {
            name: "Amathole District",
            municipalities: ["Amahlathi", "Great Kei", "Mbhashe", "Mnguma", "Nkonkobe", "Nxuba"],
          },
          {
            name: "Chris Hani District",
            municipalities: ["Enoch Mgijima", "Engcobo", "Intsika Yethu", "Inxuba Yethemba", "Sakhisizwe"],
          },
          {
            name: "Joe Gqabi District",
            municipalities: ["Elundini", "Senqu", "Walter Sisulu"],
          },
          {
            name: "OR Tambo District",
            municipalities: ["King Sabata Dalindyebo", "Mhlontlo", "Nyandeni", "Port St Johns"],
          },
          {
            name: "Sarah Baartman District",
            municipalities: ["Blue Crane Route", "Dr Beyers Naudé", "Kouga", "Kou-Kamma", "Makana", "Ndlambe", "Sunday's River Valley"],
          },
          { name: "Buffalo City Metro", municipalities: [] },
          { name: "Nelson Mandela Bay Metro", municipalities: [] },
        ],
      },
      {
        name: "Free State",
        districts: [
          { name: "Fezile Dabi District", municipalities: ["Mafube", "Moqhaka", "Ngwathe", "Metsimaholo"] },
          { name: "Lejweleputswa District", municipalities: ["Masilonyana", "Matjhabeng", "Nala", "Tokologo", "Tswelopele"] },
          { name: "Thabo Mofutsanyana District", municipalities: ["Dihlabeng", "Malanoti", "Mantsopa", "Phumelela", "Setsoto", "Nketoana"] },
          { name: "Xhariep District", municipalities: ["Kopanong", "Letsemeng", "Mohokare"] },
          { name: "Mangaung Metro", municipalities: [] },
        ],
      },
      {
        name: "Gauteng",
        districts: [
          { name: "Sedibeng District", municipalities: ["Emfuleni", "Lesedi", "Midvaal"] },
          { name: "West Rand District", municipalities: ["Merafong City", "Mogale City", "Rand West City"] },
          { name: "City of Johannesburg Metro", municipalities: [] },
          { name: "City of Tshwane Metro", municipalities: [] },
          { name: "Ekurhuleni Metro", municipalities: [] },
        ],
      },
      {
        name: "KwaZulu-Natal",
        districts: [
          { name: "Amajuba District", municipalities: ["Dannhauser", "eMadlangeni", "Newcastle"] },
          { name: "Harry Gwala District", municipalities: ["Bhubhe", "Greater Kokstad", "Umzimkhulu", "Dr Nkosazana Dlamini Zuma"] },
          { name: "iLembe District", municipalities: ["KwaDukuza", "Mandeni", "Maphumulo", "Ndwedwe"] },
          { name: "King Cetshwayo District", municipalities: ["Mbonambi", "Mthonjaneni", "Ntambanana", "uMhlathuze", "uMlalazi"] },
          { name: "Ugu District", municipalities: ["Ray Nkonyeni", "Umuziwabantu", "Umzumbe", "uMdoni", "uMuziwabantu"] },
          { name: "uMgungundlovu District", municipalities: ["Impendle", "Mkhambathini", "Mpofana", "Msunduzi", "Richmond", "uMngeni", "uMshwathi"] },
          { name: "uMkhanyakude District", municipalities: ["Big Five Hlabisa", "Jozini", "Mtubatuba", "uMhlabuyalingana"] },
          { name: "uMzinyathi District", municipalities: ["Endumeni", "Msinga", "Nquthu", "Umvoti"] },
          { name: "uThukela District", municipalities: ["Alfred Duma", "Inkosi Langalibalele", "Okhahlamba"] },
          { name: "Zululand District", municipalities: ["AbaQulusi", "Nongoma", "Ulundi", "uPhongolo"] },
          { name: "eThekwini Metro", municipalities: [] },
        ],
      },
      {
        name: "Limpopo",
        districts: [
          { name: "Capricorn District", municipalities: ["Blouberg", "Lepelle-Nkumpi", "Molemole", "Polokwane"] },
          { name: "Mopani District", municipalities: ["Ba-Phalaborwa", "Greater Giyani", "Greater Letaba", "Greater Tzaneen", "Maruleng"] },
          { name: "Sekhukhune District", municipalities: ["Elias Motsoaledi", "Ephraim Mogale", "Fetakgomo Tubatse", "Makhuduthamaga"] },
          { name: "Vhembe District", municipalities: ["Collins Chabane", "Makhado", "Musina", "Thulamela"] },
          { name: "Waterberg District", municipalities: ["Bela-Bela", "Lephalale", "Mogalakwena", "Modimolle-Mookgophong", "Thabazimbi"] },
        ],
      },
      {
        name: "Mpumalanga",
        districts: [
          { name: "Ehlanzeni District", municipalities: ["Bushbuckridge", "Mbombela", "Nkomazi", "Thaba Chweu"] },
          { name: "Gert Sibande District", municipalities: ["Chief Albert Luthuli", "Dipaliseng", "Govan Mbeki", "Lekwa", "Mkhondo", "Msukaligwa", "Pixley Ka Seme"] },
          { name: "Nkangala District", municipalities: ["Dr JS Moroka", "Emalahleni", "Steve Tshwete", "Thembisile", "Victor Khanye"] },
        ],
      },
      {
        name: "North West",
        districts: [
          { name: "Bojanala District", municipalities: ["Kgetleng", "Madibeng", "Moretele", "Moses Kotane", "Rustenburg"] },
          { name: "Dr Kenneth Kaunda District", municipalities: ["City of Matlosana", "JB Marks", "Maquassi Hills", "Ventersdorp"] },
          { name: "Dr Ruth Segomotsi Mompati District", municipalities: ["Greater Taung", "Kagisano-Molopo", "Lekwa-Teemane", "Mamusa", "Naledi"] },
          { name: "Ngaka Modiri Molema District", municipalities: ["Ditsobotla", "Mahikeng", "Ratlou", "Ramotshere Moiloa", "Tswaing"] },
        ],
      },
      {
        name: "Northern Cape",
        districts: [
          { name: "Frances Baard District", municipalities: ["Dikgatlong", "Magareng", "Phokwane", "Sol Plaatje"] },
          { name: "John Taolo Gaetsewe District", municipalities: ["Joe Morolong", "Ga-Segonyana", "Gamagara"] },
          { name: "Namakwa District", municipalities: ["Hantam", "Kamiesberg", "Karoo Hoogland", "Nama Khoi", "Richtersveld"] },
          { name: "Pixley Ka Seme District", municipalities: ["Emthanjeni", "Kareeberg", "Renosterberg", "Siyancuma", "Siyathemba", "Thembelihle", "Ubuntu", "Umsobomvu"] },
          { name: "ZF Mgcawu District", municipalities: ["Dawid Kruiper", "Kai !Garib", "!Kheis", "Tsantsabane", "Kgatelopele"] },
        ],
      },
      {
        name: "Western Cape",
        districts: [
          { name: "Cape Winelands District", municipalities: ["Breede Valley", "Drakenstein", "Langeberg", "Stellenbosch", "Witzenberg"] },
          { name: "Central Karoo District", municipalities: ["Beaufort West", "Laingsburg", "Prince Albert"] },
          { name: "Garden Route District", municipalities: ["Bitou", "George", "Hessequa", "Kannaland", "Knysna", "Mossel Bay", "Oudtshoorn"] },
          { name: "Overberg District", municipalities: ["Cape Agulhas", "Overstrand", "Swellendam", "Theewaterskloof"] },
          { name: "West Coast District", municipalities: ["Bergrivier", "Cederberg", "Matzikama", "Saldanha Bay", "Swartland"] },
          { name: "City of Cape Town Metro", municipalities: [] },
        ],
      },
    ];

    // Create provinces, districts, municipalities
    for (const p of provinceData) {
      const province = await prisma.province.create({ data: { name: p.name } });
      for (const d of p.districts) {
        const district = await prisma.district.create({
          data: { name: d.name, provinceId: province.id },
        });
        for (const m of d.municipalities) {
          await prisma.municipality.create({
            data: { name: m, districtId: district.id },
          });
        }
      }
    }
    console.log("Provinces, districts, municipalities created");

    // ─── SECTORS ────────────────────────────────────────
    const sectorData = [
      {
        name: "Water Services",
        description: "Water supply, sanitation, wastewater treatment",
        categories: ["Infrastructure Failure", "Water Quality", "Supply Disruption", "Sanitation Backlog", "Bulk Water Supply"],
      },
      {
        name: "Electricity Supply",
        description: "Electricity distribution, infrastructure, load shedding",
        categories: ["Infrastructure Failure", "Load Shedding Impact", "Illegal Connections", "Bulk Supply Issues", "Prepaid Metering"],
      },
      {
        name: "Waste Management",
        description: "Refuse collection, landfill operations, recycling",
        categories: ["Collection Failure", "Landfill Overcapacity", "Illegal Dumping", "Recycling Program", "Hazardous Waste"],
      },
      {
        name: "Roads & Transport",
        description: "Road infrastructure, public transport, traffic management",
        categories: ["Road Deterioration", "Bridge Safety", "Public Transport Failure", "Traffic Management", "Storm Water Damage"],
      },
      {
        name: "Governance & Financial Distress",
        description: "Municipal governance, financial management, admin capacity",
        categories: ["Audit Findings", "Budget Shortfall", "Staff Vacancies", "Supply Chain Failure", "IT Systems Failure"],
      },
      {
        name: "Human Settlements",
        description: "Housing, land administration, informal settlements",
        categories: ["Housing Backlog", "Informal Settlements", "Land Invasion", "Title Deeds", "Evictions"],
      },
      {
        name: "Environment",
        description: "Environmental compliance, pollution, climate adaptation",
        categories: ["Air Quality", "Water Pollution", "Land Degradation", "Climate Adaptation", "Biodiversity Loss"],
      },
      {
        name: "Other",
        description: "Other service delivery areas",
        categories: ["Emergency Services", "Social Services", "Parks & Recreation", "Community Safety", "LED & Tourism"],
      },
    ];

    for (const s of sectorData) {
      const sector = await prisma.sector.create({
        data: { name: s.name, description: s.description },
      });
      for (const cat of s.categories) {
        await prisma.failureCategory.create({
          data: { name: cat, sectorId: sector.id },
        });
      }
    }
    console.log("Sectors and failure categories created");

    // ─── DEPARTMENTS ────────────────────────────────────
    const departments = [
      { name: "DCoG - National", sphere: "National", sector: "Governance & Financial Distress" },
      { name: "DWS - Water & Sanitation", sphere: "National", sector: "Water Services" },
      { name: "DMRE - Energy", sphere: "National", sector: "Electricity Supply" },
      { name: "DPWI - Public Works", sphere: "National", sector: "Human Settlements" },
      { name: "DOH - Health", sphere: "National", sector: "Other" },
      { name: "DTIC - Trade & Industry", sphere: "National", sector: "Other" },
      { name: "DPE - Public Enterprises", sphere: "National", sector: "Electricity Supply" },
      { name: "Provincial COGTA - EC", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - FS", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - GP", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - KZN", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - LP", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - MP", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - NW", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - NC", sphere: "Provincial", sector: "Governance & Financial Distress" },
      { name: "Provincial COGTA - WC", sphere: "Provincial", sector: "Governance & Financial Distress" },
    ];

    for (const d of departments) {
      await prisma.department.create({ data: d });
    }
    console.log("Departments created");

    // ─── USERS ──────────────────────────────────────────
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const users = [
      { name: "Dr. Thandi Modise", email: "minister@cogta.gov.za", password: passwordHash, role: "minister", department: "DCoG - National" },
      { name: "Mr. Sipho Nkosi", email: "director.general@cogta.gov.za", password: passwordHash, role: "director_general", department: "DCoG - National" },
      { name: "Ms. Nomvula Mthembu", email: "national.director@cogta.gov.za", password: passwordHash, role: "national_director", department: "DCoG - National" },
      { name: "Mr. Thabo Radebe", email: "provincial.kzn@cogta.gov.za", password: passwordHash, role: "provincial_coordinator", department: "Provincial COGTA - KZN", province: "KwaZulu-Natal" },
      { name: "Ms. Lerato Moloi", email: "provincial.gp@cogta.gov.za", password: passwordHash, role: "provincial_coordinator", department: "Provincial COGTA - GP", province: "Gauteng" },
      { name: "Mr. Bongani Zulu", email: "analyst@cogta.gov.za", password: passwordHash, role: "hub_analyst", department: "DCoG - National" },
      { name: "Ms. Zanele Dlamini", email: "intake@cogta.gov.za", password: passwordHash, role: "intake_officer", department: "DCoG - National" },
      { name: "Mr. Peter Williams", email: "admin@cogta.gov.za", password: passwordHash, role: "admin", department: "DCoG - National" },
    ];

    for (const u of users) {
      await prisma.user.create({ data: u });
    }
    console.log("Users created");

    // ─── SAMPLE CASES ────────────────────────────────────
    const allProvinces = await prisma.province.findMany();
    const allSectors = await prisma.sector.findMany();
    const allCategories = await prisma.failureCategory.findMany();
    const allDistricts = await prisma.district.findMany();
    const allMunicipalities = await prisma.municipality.findMany();
    const analystUser = await prisma.user.findFirst({ where: { role: "hub_analyst" } });
    const nationalDirector = await prisma.user.findFirst({ where: { role: "national_director" } });

    const sampleCases = [
      { title: "Bulk water supply interruption - KwaMashu", description: "Major water supply interruption affecting 50,000 households in KwaMashu due to burst bulk main", sector: "Water Services", severityScore: 85, severityLevel: "Critical", populationAffected: 250000, status: "intervention", province: "KwaZulu-Natal", district: "eThekwini Metro", intakeChannel: "whatsapp" },
      { title: "Electrical transformer explosion - Soweto", description: "Transformer explosion in Dlamini, Soweto leaving 8,000 homes without power for 5 days", sector: "Electricity Supply", severityScore: 78, severityLevel: "Critical", populationAffected: 40000, status: "escalated", province: "Gauteng", district: "City of Johannesburg Metro", intakeChannel: "whatsapp", escalationLevel: "L2" },
      { title: "Refuse collection backlog - Tembisa", description: "Waste not collected for 6 weeks in Tembisa, health hazard emerging", sector: "Waste Management", severityScore: 72, severityLevel: "High", populationAffected: 150000, status: "assigned", province: "Gauteng", district: "Ekurhuleni Metro", intakeChannel: "email" },
      { title: "Road collapse - N2 near Mthatha", description: "Section of N2 near Mthatha collapsed after heavy rains, disrupting transport corridor", sector: "Roads & Transport", severityScore: 88, severityLevel: "Critical", populationAffected: 80000, status: "intervention", province: "Eastern Cape", district: "OR Tambo District", intakeChannel: "manual", publicSafetyRisk: true },
      { title: "Municipal financial crisis - Emfuleni", description: "Emfuleni LM unable to pay Eskom debt of R1.8 billion, risk of disconnection", sector: "Governance & Financial Distress", severityScore: 90, severityLevel: "Critical", populationAffected: 350000, status: "monitoring", province: "Gauteng", district: "Sedibeng District", intakeChannel: "municipal_report", isRecurring: true, escalationLevel: "L3" },
      { title: "Water quality issue - Vaal Triangle", description: "Blue drop compliance failure, high E.coli levels in drinking water", sector: "Water Services", severityScore: 82, severityLevel: "High", populationAffected: 750000, status: "action_plan", province: "Gauteng", district: "Sedibeng District", intakeChannel: "email", publicSafetyRisk: true },
      { title: "Informal settlement fire - Khayelitsha", description: "Devastating fire in Site C, Khayelitsha displacing 3,000 families", sector: "Human Settlements", severityScore: 80, severityLevel: "Critical", populationAffected: 15000, status: "intervention", province: "Western Cape", district: "City of Cape Town Metro", intakeChannel: "whatsapp" },
      { title: "Custodianship dispute - Nongoma", description: "Traditional council and municipality in dispute over land allocation, housing blocked", sector: "Human Settlements", severityScore: 45, severityLevel: "Moderate", populationAffected: 25000, status: "classified", province: "KwaZulu-Natal", district: "Zululand District", intakeChannel: "manual" },
      { title: "Sewage spill - Hammanskraal", description: "Raw sewage flowing into residential areas, ongoing health crisis", sector: "Water Services", severityScore: 92, severityLevel: "Critical", populationAffected: 45000, status: "escalated", province: "Gauteng", district: "City of Tshwane Metro", intakeChannel: "whatsapp", publicSafetyRisk: true, escalationLevel: "L2", protestMediaFlag: true },
      { title: "Load shedding escalation - Lephalale", description: "Unplanned 48-hour outage affecting Lephalale town, Eskom grid constraints", sector: "Electricity Supply", severityScore: 70, severityLevel: "High", populationAffected: 30000, status: "monitoring", province: "Limpopo", district: "Waterberg District", intakeChannel: "email", isRecurring: true },
      { title: "Illegal dumping crisis - Alexandra", description: "Illegal dumping sites proliferating in Alexandra, health department concerned", sector: "Waste Management", severityScore: 50, severityLevel: "Moderate", populationAffected: 180000, status: "assigned", province: "Gauteng", district: "City of Johannesburg Metro", intakeChannel: "manual" },
      { title: "Municipal staff strike - Merafong", description: "Employees on strike over unpaid wages, all services suspended", sector: "Governance & Financial Distress", severityScore: 75, severityLevel: "High", populationAffected: 200000, status: "action_plan", province: "Gauteng", district: "West Rand District", intakeChannel: "municipal_report" },
      { title: "Road infrastructure - Mafikeng CBD", description: "Major potholes and road deterioration in Mafikeng CBD causing accidents", sector: "Roads & Transport", severityScore: 40, severityLevel: "Moderate", populationAffected: 50000, status: "under_verification", province: "North West", district: "Ngaka Modiri Molema District", intakeChannel: "public" },
      { title: "Air quality concerns - Secunda", description: "Community complaints about air pollution from Sasol operations", sector: "Environment", severityScore: 55, severityLevel: "High", populationAffected: 120000, status: "classified", province: "Mpumalanga", district: "Gert Sibande District", intakeChannel: "whatsapp" },
      { title: "Water supply - Makhado Municipality", description: "Severe water shortages affecting rural villages in Makhado for over 2 weeks", sector: "Water Services", severityScore: 72, severityLevel: "High", populationAffected: 65000, status: "action_plan", province: "Limpopo", district: "Vhembe District", intakeChannel: "whatsapp", durationDays: 15 },
      { title: "Housing backlog - Nelson Mandela Bay", description: "Over 50,000 families on housing waiting list, emergency shelter crisis", sector: "Human Settlements", severityScore: 60, severityLevel: "High", populationAffected: 250000, status: "assigned", province: "Eastern Cape", district: "Nelson Mandela Bay Metro", intakeChannel: "manual" },
      { title: "Electricity theft - Soweto", description: "Widespread illegal connections causing grid instability and safety hazards", sector: "Electricity Supply", severityScore: 65, severityLevel: "High", populationAffected: 200000, status: "monitoring", province: "Gauteng", district: "City of Johannesburg Metro", intakeChannel: "email", isRecurring: true },
      { title: "Land invasion - Philippi", description: "Large-scale land invasion in Philippi, 5,000 structures erected illegally", sector: "Human Settlements", severityScore: 68, severityLevel: "High", populationAffected: 30000, status: "escalated", province: "Western Cape", district: "City of Cape Town Metro", intakeChannel: "municipal_report", escalationLevel: "L1" },
      { title: "Dam failure risk - Jozini", description: "Pongolapoort Dam structural concerns, risk of downstream flooding", sector: "Water Services", severityScore: 85, severityLevel: "Critical", populationAffected: 100000, status: "monitoring", province: "KwaZulu-Natal", district: "uMkhanyakude District", intakeChannel: "manual", publicSafetyRisk: true },
      { title: "Sanitation backlog - Giyani", description: "No proper sanitation facilities in 15 villages, open defecation reported", sector: "Water Services", severityScore: 78, severityLevel: "Critical", populationAffected: 40000, status: "action_plan", province: "Limpopo", district: "Mopani District", intakeChannel: "whatsapp" },
      { title: "Coal truck congestion - Emalahleni", description: "Coal truck traffic causing gridlock and air quality issues in Emalahleni CBD", sector: "Roads & Transport", severityScore: 45, severityLevel: "Moderate", populationAffected: 80000, status: "classified", province: "Mpumalanga", district: "Nkangala District", intakeChannel: "email" },
      { title: "Municipal audit qualified - Lekwa", description: "Lekwa LM received disclaimer audit opinion for 3 consecutive years", sector: "Governance & Financial Distress", severityScore: 70, severityLevel: "High", populationAffected: 115000, status: "assigned", province: "Mpumalanga", district: "Gert Sibande District", intakeChannel: "municipal_report", isRecurring: true },
      { title: "Flood damage - uMkhanyakude", description: "Severe flooding damaged roads, bridges, and homes in uMkhanyakude district", sector: "Roads & Transport", severityScore: 75, severityLevel: "High", populationAffected: 35000, status: "intervention", province: "KwaZulu-Natal", district: "uMkhanyakude District", intakeChannel: "whatsapp" },
      { title: "Illegal mining - Orkney", description: "Illegal mining activity causing environmental damage and safety risks", sector: "Environment", severityScore: 50, severityLevel: "Moderate", populationAffected: 20000, status: "new_submission", province: "North West", district: "Dr Kenneth Kaunda District", intakeChannel: "public" },
      { title: "Hospital water crisis - Eastern Cape", description: "Three district hospitals without running water for over a week", sector: "Water Services", severityScore: 82, severityLevel: "Critical", populationAffected: 20000, status: "escalated", province: "Eastern Cape", district: "Amathole District", intakeChannel: "email", publicSafetyRisk: true, escalationLevel: "L3" },
      { title: "Ratepayer boycott - Midvaal", description: "Organized ratepayer boycott over poor service delivery affecting revenue collection", sector: "Governance & Financial Distress", severityScore: 55, severityLevel: "Moderate", populationAffected: 95000, status: "new_submission", province: "Gauteng", district: "Sedibeng District", intakeChannel: "municipal_report" },
      { title: "Road bridge collapse - Mthatha", description: "Bridge on R61 collapsed after truck collision, isolating 6 villages", sector: "Roads & Transport", severityScore: 88, severityLevel: "Critical", populationAffected: 25000, status: "intervention", province: "Eastern Cape", district: "OR Tambo District", intakeChannel: "whatsapp", publicSafetyRisk: true },
      { title: "Electricity infrastructure vandalism - Tshwane", description: "Systematic cable theft and substation vandalism in Tshwane northern areas", sector: "Electricity Supply", severityScore: 62, severityLevel: "High", populationAffected: 180000, status: "assigned", province: "Gauteng", district: "City of Tshwane Metro", intakeChannel: "email" },
      { title: "Drought impact - Karoo", description: "Severe drought in Central Karoo, livestock losses, water rationing needed", sector: "Environment", severityScore: 70, severityLevel: "High", populationAffected: 15000, status: "classified", province: "Western Cape", district: "Central Karoo District", intakeChannel: "public", durationDays: 90 },
      { title: "Wastewater treatment failure - Umhlathuze", description: "Richards Bay wastewater treatment plant at critical failure risk", sector: "Water Services", severityScore: 68, severityLevel: "High", populationAffected: 100000, status: "action_plan", province: "KwaZulu-Natal", district: "King Cetshwayo District", intakeChannel: "municipal_report" },
    ];

    for (const sc of sampleCases) {
      const province = allProvinces.find((p: { name: string }) => p.name === sc.province);
      const district = allDistricts.find((d: { name: string }) => d.name === sc.district);
      const sector = allSectors.find((s: { name: string }) => s.name === sc.sector);
      const category = allCategories.find((c: { sectorId: string }) => c.sectorId === sector?.id);

      await prisma.case.create({
        data: {
          title: sc.title,
          description: sc.description,
          referenceNumber: `NSDCH-${2025}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          intakeChannel: sc.intakeChannel,
          provinceId: province?.id || null,
          districtId: district?.id || null,
          municipalityId: district ? (allMunicipalities.find((m: { districtId: string }) => m.districtId === district.id)?.id || null) : null,
          sectorId: sector?.id || null,
          failureCategoryId: category?.id || null,
          severityScore: sc.severityScore,
          severityLevel: sc.severityLevel,
          populationAffected: sc.populationAffected,
          publicSafetyRisk: sc.publicSafetyRisk || false,
          isRecurring: sc.isRecurring || false,
          status: sc.status,
          durationDays: sc.durationDays || 0,
          escalationLevel: sc.escalationLevel || "none",
          assignedToId: analystUser?.id || null,
          ownerId: nationalDirector?.id || null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          actionPlan: `Action plan for ${sc.title.substring(0, 40)}...`,
          progressPercent: Math.floor(Math.random() * 80),
          blockers: Math.random() > 0.5 ? "Awaiting budget approval, stakeholder engagement pending" : null,
        },
      });
    }
    console.log("Sample cases created");

    // ─── SLA CONFIG ─────────────────────────────────────
    const slaConfigs = [
      { severityLevel: "Critical", responseTimeHours: 4, resolutionDays: 3, escalationAfterHours: 24, description: "Immediate response required, 24/7 monitoring" },
      { severityLevel: "High", responseTimeHours: 8, resolutionDays: 7, escalationAfterHours: 48, description: "Rapid response within business hours" },
      { severityLevel: "Moderate", responseTimeHours: 24, resolutionDays: 14, escalationAfterHours: 72, description: "Standard response within 1 business day" },
      { severityLevel: "Stable", responseTimeHours: 48, resolutionDays: 30, escalationAfterHours: 120, description: "Routine monitoring and resolution" },
    ];

    for (const sla of slaConfigs) {
      await prisma.slaConfig.create({ data: sla });
    }
    console.log("SLA configs created");

    // ─── ESCALATION RULES ───────────────────────────────
    const escalationRules = [
      { name: "Missed SLA Deadline", condition: "missed_sla", severityMin: "Moderate", escalateTo: "L1", afterHours: 24, enabled: true },
      { name: "No Action Plan Submitted", condition: "no_action_plan", severityMin: "Moderate", escalateTo: "L1", afterHours: 72, enabled: true },
      { name: "Public Safety Risk", condition: "safety_risk", severityMin: "High", escalateTo: "L2", afterHours: 12, enabled: true },
      { name: "Recurring Failure Pattern", condition: "recurring", severityMin: "Moderate", escalateTo: "L2", afterHours: 48, enabled: true },
      { name: "Protest/Media Attention", condition: "protest_media", severityMin: "High", escalateTo: "L3", afterHours: 8, enabled: true },
      { name: "Critical Infrastructure Failure", condition: "missed_sla", severityMin: "Critical", escalateTo: "L3", afterHours: 12, enabled: true },
      { name: "Multi-Province Crisis", condition: "safety_risk", severityMin: "Critical", escalateTo: "L4", afterHours: 6, enabled: true },
      { name: "National Security Threat", condition: "protest_media", severityMin: "Critical", escalateTo: "L5", afterHours: 2, enabled: true },
    ];

    for (const rule of escalationRules) {
      await prisma.escalationRule.create({ data: rule });
    }
    console.log("Escalation rules created");

    // ─── ADD SOME MILESTONES ────────────────────────────
    const actionCases = await prisma.case.findMany({
      where: { status: { in: ["action_plan", "intervention"] } },
      take: 5,
    });

    for (const c of actionCases) {
      const milestones = [
        { caseId: c.id, title: "Incident Assessment Complete", description: "Initial assessment and verification of the incident", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "completed", order: 1 },
        { caseId: c.id, title: "Stakeholder Engagement", description: "Engage with all relevant stakeholders", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "in_progress", order: 2 },
        { caseId: c.id, title: "Action Plan Developed", description: "Detailed intervention plan", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: "pending", order: 3 },
        { caseId: c.id, title: "Implementation Phase 1", description: "Begin implementation of priority actions", dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), status: "pending", order: 4 },
        { caseId: c.id, title: "Monitoring & Reporting", description: "Track progress and report outcomes", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "pending", order: 5 },
      ];

      for (const m of milestones) {
        await prisma.milestone.create({ data: m });
      }
    }
    console.log("Milestones created");

    // ─── ADD AUDIT LOGS ─────────────────────────────────
    const allCases = await prisma.case.findMany({ take: 10 });
    const actions = ["CASE_CREATED", "CASE_UPDATED", "STATUS_CHANGED", "ASSIGNED", "CLASSIFIED", "REVIEWED"];
    const usersList = await prisma.user.findMany({ take: 3 });

    for (const c of allCases) {
      const numLogs = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numLogs; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        await prisma.auditLog.create({
          data: {
            caseId: c.id,
            userId: usersList[i % usersList.length]?.id || null,
            action,
            comment: `${action} for case ${c.referenceNumber}`,
            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log("Audit logs created");

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
