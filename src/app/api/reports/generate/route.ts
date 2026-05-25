import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportFormat = "word" | "excel";
type ReportType = "weekly" | "monthly" | "critical" | "provincial" | "sector" | "sla" | "custom";

const REPORT_TITLES: Record<ReportType, string> = {
  weekly: "Weekly Service Delivery Failure Report",
  monthly: "Monthly Coordination Summary",
  critical: "Critical Incident Brief",
  provincial: "Provincial Performance Report",
  sector: "Sector Response Report",
  sla: "SLA Compliance Report",
  custom: "Custom Service Delivery Coordination Report",
};

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New Submission",
  under_verification: "Verification",
  duplicate: "Duplicate",
  classified: "Classified",
  assigned: "Assigned",
  action_plan: "Action Plan",
  intervention: "Intervention",
  monitoring: "Monitoring",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const SEVERITIES = ["Critical", "High", "Moderate", "Stable"];

function toDateInput(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultDateRange(type: ReportType) {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  if (type === "weekly" || type === "sla") {
    from.setDate(from.getDate() - 7);
  } else if (type === "monthly" || type === "provincial" || type === "sector") {
    from.setDate(1);
  } else {
    from.setMonth(from.getMonth() - 3);
  }
  from.setHours(0, 0, 0, 0);

  return { from, to };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function barChart(title: string, rows: Array<{ label: string; value: number }>, color = "#2563eb") {
  const width = 760;
  const rowHeight = 32;
  const chartHeight = Math.max(120, rows.length * rowHeight + 38);
  const max = Math.max(1, ...rows.map((row) => row.value));

  const bars = rows.map((row, index) => {
    const y = 32 + index * rowHeight;
    const barWidth = Math.max(4, Math.round((row.value / max) * 430));
    return `
      <text x="0" y="${y + 16}" font-size="12" fill="#334155">${escapeHtml(row.label)}</text>
      <rect x="220" y="${y}" width="${barWidth}" height="20" rx="4" fill="${color}" opacity="0.9"></rect>
      <text x="${230 + barWidth}" y="${y + 15}" font-size="12" fill="#0f172a" font-weight="700">${row.value}</text>
    `;
  }).join("");

  return `
    <div class="chart">
      <h3>${escapeHtml(title)}</h3>
      <svg width="${width}" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="18" font-size="14" font-weight="700" fill="#0f172a">${escapeHtml(title)}</text>
        ${bars}
      </svg>
    </div>
  `;
}

function htmlTable(headers: string[], rows: Array<Array<unknown>>) {
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function responseFor(content: string, filename: string, format: ReportFormat) {
  const contentType = format === "excel"
    ? "application/vnd.ms-excel; charset=utf-8"
    : "application/msword; charset=utf-8";

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const access = await getAccessContext(request);
  if (!access) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const type = (params.get("type") || "custom") as ReportType;
  const format = (params.get("format") || "word") as ReportFormat;

  if (!REPORT_TITLES[type] || !["word", "excel"].includes(format)) {
    return NextResponse.json({ error: "Invalid report request" }, { status: 400 });
  }

  const defaults = defaultDateRange(type);
  const from = toDateInput(params.get("from")) || defaults.from;
  const to = toDateInput(params.get("to")) || defaults.to;
  to.setHours(23, 59, 59, 999);

  const provinceId = params.get("provinceId") || "";
  const sectorId = params.get("sectorId") || "";
  const severity = params.get("severity") || "";
  const status = params.get("status") || "";

  const where: any = {
    dateReceived: {
      gte: from,
      lte: to,
    },
  };

  if (type === "critical") where.severityLevel = "Critical";
  if (access.isProvinceScoped) {
    if (!access.provinceId) {
      return NextResponse.json({ error: "Your user is not linked to a province" }, { status: 403 });
    }
    where.provinceId = access.provinceId;
  } else if (provinceId) {
    where.provinceId = provinceId;
  }
  if (sectorId) where.sectorId = sectorId;
  if (severity) where.severityLevel = severity;
  if (status) where.status = status;

  const cases = await prisma.case.findMany({
    where,
    include: {
      province: { select: { name: true } },
      district: { select: { name: true } },
      municipality: { select: { name: true } },
      sector: { select: { name: true } },
      failureCategory: { select: { name: true } },
      assignedTo: { select: { name: true } },
      leadDepartment: { select: { name: true } },
    },
    orderBy: [
      { severityScore: "desc" },
      { dateReceived: "desc" },
    ],
    take: 500,
  });

  const totalCases = cases.length;
  const resolvedCases = cases.filter((item) => ["resolved", "closed"].includes(item.status)).length;
  const overdueCases = cases.filter((item) =>
    item.slaDeadline && item.slaDeadline < new Date() && !["resolved", "closed"].includes(item.status)
  ).length;
  const escalatedCases = cases.filter((item) => item.escalationLevel && item.escalationLevel !== "none").length;
  const peopleAffected = cases.reduce((sum, item) => sum + (item.populationAffected || 0), 0);

  const bySeverity = SEVERITIES.map((label) => ({
    label,
    value: cases.filter((item) => item.severityLevel === label).length,
  }));

  const byStatus = Object.entries(
    cases.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({ label: STATUS_LABELS[key] || key, value }));

  const byProvince = Object.entries(
    cases.reduce<Record<string, number>>((acc, item) => {
      const key = item.province?.name || "Unassigned";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const bySector = Object.entries(
    cases.reduce<Record<string, number>>((acc, item) => {
      const key = item.sector?.name || "Unassigned";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const generatedAt = new Date();
  const title = REPORT_TITLES[type];
  const filters = [
    `Period: ${formatDate(from)} to ${formatDate(to)}`,
    access.isProvinceScoped
      ? `Province: ${access.provinceName || "Your province"}`
      : provinceId ? "Province: filtered" : "Province: All",
    sectorId ? "Sector: filtered" : "Sector: All",
    severity ? `Severity: ${severity}` : "Severity: All",
    status ? `Status: ${STATUS_LABELS[status] || status}` : "Status: All",
  ];

  const summaryRows = [
    ["Total cases", totalCases],
    ["Resolved / closed", resolvedCases],
    ["Overdue", overdueCases],
    ["Escalated", escalatedCases],
    ["People affected", peopleAffected.toLocaleString("en-ZA")],
  ];

  const caseRows = cases.map((item) => [
    item.referenceNumber,
    item.title,
    item.province?.name || "-",
    item.sector?.name || "-",
    item.severityLevel,
    STATUS_LABELS[item.status] || item.status,
    item.assignedTo?.name || "Unassigned",
    item.populationAffected,
    item.slaDeadline ? formatDate(item.slaDeadline) : "-",
  ]);

  const caseHeaders = [
    "Reference",
    "Title",
    "Province",
    "Sector",
    "Severity",
    "Status",
    "Assigned To",
    "People Affected",
    "SLA Deadline",
  ];

  const charts = [
    barChart("Cases by Severity", bySeverity, "#dc2626"),
    barChart("Cases by Province", byProvince, "#2563eb"),
    barChart("Cases by Sector", bySector, "#7c3aed"),
    barChart("Cases by Status", byStatus, "#0f766e"),
  ].join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
          h1 { color: #0f172a; margin-bottom: 4px; }
          h2 { margin-top: 24px; color: #1e3a8a; border-bottom: 1px solid #dbeafe; padding-bottom: 6px; }
          h3 { margin: 0 0 10px; color: #0f172a; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
          .filters { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 12px; margin: 16px 0; }
          .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 18px 0; }
          .kpi { border: 1px solid #e5e7eb; background: #f8fafc; padding: 10px; }
          .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .kpi-value { font-size: 22px; font-weight: 700; color: #0f172a; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0 22px; font-size: 12px; }
          th { background: #1e40af; color: white; text-align: left; padding: 7px; }
          td { border: 1px solid #dbe3ef; padding: 7px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .chart { border: 1px solid #e5e7eb; padding: 12px; margin: 14px 0; page-break-inside: avoid; }
          .note { color: #475569; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Generated ${escapeHtml(formatDate(generatedAt))} by the National Service Delivery Coordination Hub</div>
        <div class="filters">${filters.map((item) => `<div>${escapeHtml(item)}</div>`).join("")}</div>
        <div class="kpis">
          ${summaryRows.map(([label, value]) => `
            <div class="kpi">
              <div class="kpi-label">${escapeHtml(label)}</div>
              <div class="kpi-value">${escapeHtml(value)}</div>
            </div>
          `).join("")}
        </div>
        <h2>Executive Summary</h2>
        <p>
          This report covers ${totalCases} cases from ${escapeHtml(formatDate(from))} to ${escapeHtml(formatDate(to))}.
          It highlights service delivery failures, escalation posture, people affected, and operational priorities for coordination.
        </p>
        <h2>Charts</h2>
        ${charts}
        <h2>KPI Summary</h2>
        ${htmlTable(["Metric", "Value"], summaryRows)}
        <h2>Case Register</h2>
        ${htmlTable(caseHeaders, caseRows)}
        <p class="note">Report data is generated from the live coordination hub database at request time.</p>
      </body>
    </html>
  `;

  const workbook = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          h1, h2 { color: #1e40af; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
          th { background: #1e40af; color: #ffffff; font-weight: bold; }
          th, td { border: 1px solid #94a3b8; padding: 6px; font-size: 12px; }
          .bar { background: #dbeafe; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Generated ${escapeHtml(formatDate(generatedAt))}</p>
        <h2>Filters</h2>
        ${htmlTable(["Filter"], filters.map((item) => [item]))}
        <h2>KPI Summary</h2>
        ${htmlTable(["Metric", "Value"], summaryRows)}
        <h2>Cases by Severity</h2>
        ${htmlTable(["Severity", "Cases"], bySeverity.map((row) => [row.label, row.value]))}
        <h2>Cases by Province</h2>
        ${htmlTable(["Province", "Cases"], byProvince.map((row) => [row.label, row.value]))}
        <h2>Cases by Sector</h2>
        ${htmlTable(["Sector", "Cases"], bySector.map((row) => [row.label, row.value]))}
        <h2>Cases by Status</h2>
        ${htmlTable(["Status", "Cases"], byStatus.map((row) => [row.label, row.value]))}
        <h2>Case Register</h2>
        ${htmlTable(caseHeaders, caseRows)}
      </body>
    </html>
  `;

  const filename = `${slug(title)}-${formatDate(generatedAt).replace(/ /g, "-").toLowerCase()}.${format === "excel" ? "xls" : "doc"}`;
  return responseFor(format === "excel" ? workbook : html, filename, format);
}
