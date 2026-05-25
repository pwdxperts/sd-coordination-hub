"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Columns, Table2, TrendingUp, FileText,
} from "lucide-react";
import DataTable from "@/components/DataTable";

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || "bg-gray-50 text-gray-600"}`;
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    action_plan: "Action Plan", intervention: "Intervention", monitoring: "Monitoring",
  };
  return map[status] || status.replace(/_/g, " ");
};

const getProgressColor = (pct: number) => {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 40) return "bg-blue-500";
  if (pct >= 20) return "bg-amber-500";
  return "bg-gray-300";
};

function MapPin(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function Building2(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></svg>; }

export default function InterventionsPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      status: "action_plan,intervention,monitoring",
      pageSize: "100",
    });
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Summary stats
  const totalInterventions = cases.length;
  const actionPlans = cases.filter((c) => c.status === "action_plan").length;
  const inProgress = cases.filter((c) => c.status === "intervention").length;
  const completed = cases.filter((c) => c.status === "monitoring").length;

  const tableColumns = [
    {
      key: "referenceNumber", label: "Reference",
      render: (r: any) => (
        <Link href={`/dashboard/cases/${r.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs font-medium">
          {r.referenceNumber}
        </Link>
      ),
    },
    {
      key: "title", label: "Title",
      render: (r: any) => <span className="font-medium text-gray-900">{r.title}</span>,
    },
    {
      key: "severityLevel", label: "Severity",
      render: (r: any) => <span className={severityBadge(r.severityLevel)}>{r.severityLevel}</span>,
    },
    {
      key: "status", label: "Status",
      render: (r: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
          r.status === "intervention" ? "bg-orange-50 text-orange-700" :
          r.status === "action_plan" ? "bg-amber-50 text-amber-700" :
          "bg-sky-50 text-sky-700"
        }`}>
          {statusLabel(r.status)}
        </span>
      ),
    },
    {
      key: "progressPercent", label: "Progress",
      render: (r: any) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getProgressColor(r.progressPercent || 0)}`} style={{ width: `${r.progressPercent || 0}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-8 text-right">{r.progressPercent || 0}%</span>
        </div>
      ),
    },
    {
      key: "province", label: "Province",
      render: (r: any) => <span className="text-gray-500 text-xs">{r.province?.name || "—"}</span>,
    },
    {
      key: "sector", label: "Sector",
      render: (r: any) => <span className="text-gray-500 text-xs">{r.sector?.name || "—"}</span>,
    },
    {
      key: "blockers", label: "Blockers",
      render: (r: any) =>
        r.blockers ? (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            {r.blockers}
          </span>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        ),
    },
    {
      key: "id", label: "", sortable: false,
      render: (r: any) => (
        <Link href={`/dashboard/cases/${r.id}`} className="text-blue-400 hover:text-blue-600">
          <ExternalLink className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Intervention Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor active interventions and action plan progress</p>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Interventions</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalInterventions}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action Plans</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{actionPlans}</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monitoring</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${view === "grid" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
          <Columns className="w-4 h-4" /> Card Grid
        </button>
        <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${view === "table" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
          <Table2 className="w-4 h-4" /> Table
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Card Grid View */}
      {view === "grid" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cases.map((caseItem: any) => (
            <Link
              key={caseItem.id}
              href={`/dashboard/cases/${caseItem.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-blue-600">{caseItem.referenceNumber}</span>
                  <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{caseItem.title}</h3>
                </div>
                <span className={severityBadge(caseItem.severityLevel)}>
                  {caseItem.severityLevel}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{caseItem.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(caseItem.progressPercent || 0)}`}
                    style={{ width: `${caseItem.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {caseItem.province?.name || "—"}
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {caseItem.sector?.name || "—"}
                </div>
              </div>

              {caseItem.blockers && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600 truncate">{caseItem.blockers}</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className={`px-1.5 py-0.5 rounded ${
                  caseItem.status === "intervention" ? "bg-orange-50 text-orange-700" :
                  caseItem.status === "action_plan" ? "bg-amber-50 text-amber-700" :
                  "bg-sky-50 text-sky-700"
                }`}>
                  {statusLabel(caseItem.status)}
                </span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
            </Link>
          ))}
          {cases.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active interventions found</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === "table" && !loading && (
        <DataTable
          data={cases}
          columns={tableColumns}
          searchPlaceholder="Search by reference, title, province, sector..."
          searchKeys={["referenceNumber", "title", "province", "sector", "severityLevel", "status"]}
        />
      )}
    </div>
  );
}


