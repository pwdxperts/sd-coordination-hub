"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  FileSpreadsheet,
  Filter,
  CalendarDays,
} from "lucide-react";

const REPORTS = [
  {
    id: "weekly",
    title: "Weekly Service Delivery Failure Report",
    description: "Consolidated report of all service delivery failures reported in the past week, including severity breakdowns and provincial distribution.",
    icon: FileText,
    frequency: "Weekly",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "monthly",
    title: "Monthly Coordination Summary",
    description: "Comprehensive monthly overview of case intake, resolution rates, escalation patterns, and coordination performance metrics.",
    icon: BarChart3,
    frequency: "Monthly",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "critical",
    title: "Critical Incident Brief",
    description: "Executive brief on all Critical severity cases with recommendations for DG/Minister intervention.",
    icon: AlertTriangle,
    frequency: "As Needed",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "provincial",
    title: "Provincial Performance Report",
    description: "Province-by-province comparison of service delivery case management, response times, and resolution rates.",
    icon: FileText,
    frequency: "Monthly",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "sector",
    title: "Sector Response Report",
    description: "Analysis of sectoral response effectiveness, highlighting best practices and areas needing improvement.",
    icon: BarChart3,
    frequency: "Monthly",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "sla",
    title: "SLA Compliance Report",
    description: "Report on SLA adherence across all severity levels, including breach analysis and escalation effectiveness.",
    icon: FileText,
    frequency: "Weekly",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

const SEVERITIES = ["Critical", "High", "Moderate", "Stable"];

const STATUSES = [
  { value: "new_submission", label: "New Submission" },
  { value: "under_verification", label: "Verification" },
  { value: "classified", label: "Classified" },
  { value: "assigned", label: "Assigned" },
  { value: "action_plan", label: "Action Plan" },
  { value: "intervention", label: "Intervention" },
  { value: "monitoring", label: "Monitoring" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildReportUrl(type: string, format: "word" | "excel", filters?: Record<string, string>) {
  const params = new URLSearchParams({ type, format });
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `/api/reports/generate?${params.toString()}`;
}

export default function ReportsPage() {
  const [options, setOptions] = useState<{ provinces: any[]; sectors: any[] }>({
    provinces: [],
    sectors: [],
  });
  const [filters, setFilters] = useState({
    type: "custom",
    from: dateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    to: dateInputValue(new Date()),
    provinceId: "",
    sectorId: "",
    severity: "",
    status: "",
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((data) => {
        setOptions({
          provinces: data.casesByProvince || [],
          sectors: data.casesBySector || [],
        });
      })
      .catch(() => {});
  }, []);

  const customFilters = useMemo(() => ({
    from: filters.from,
    to: filters.to,
    provinceId: filters.provinceId,
    sectorId: filters.sectorId,
    severity: filters.severity,
    status: filters.status,
  }), [filters]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export service delivery coordination reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                  <span className="text-xs text-gray-400">{report.frequency}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">{report.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildReportUrl(report.id, "word")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Word
                </a>
                <a
                  href={buildReportUrl(report.id, "excel")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-950">Custom Report Builder</h3>
              <p className="text-sm text-blue-700 mt-1">
                Select a report type, date range, province, sector, severity, and status. Exports include KPI summaries, case registers, and chart sections.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Report Type</span>
              <select
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="custom">Custom Report</option>
                {REPORTS.map((report) => (
                  <option key={report.id} value={report.id}>{report.title}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">From</span>
              <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => updateFilter("from", event.target.value)}
                  className="w-full text-sm text-gray-700 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">To</span>
              <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => updateFilter("to", event.target.value)}
                  className="w-full text-sm text-gray-700 outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Province</span>
              <select
                value={filters.provinceId}
                onChange={(event) => updateFilter("provinceId", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All provinces</option>
                {options.provinces.map((province) => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Sector</span>
              <select
                value={filters.sectorId}
                onChange={(event) => updateFilter("sectorId", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All sectors</option>
                {options.sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Severity</span>
              <select
                value={filters.severity}
                onChange={(event) => updateFilter("severity", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All severities</option>
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={buildReportUrl(filters.type, "word", customFilters)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Generate Word Report
            </a>
            <a
              href={buildReportUrl(filters.type, "excel", customFilters)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel Workbook
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Current Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
