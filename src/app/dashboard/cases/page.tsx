"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Columns, Table2, Clock, ExternalLink, User } from "lucide-react";
import DataTable from "@/components/DataTable";

const KANBAN_COLUMNS = [
  { id: "new_submission", label: "Received", color: "bg-blue-500" },
  { id: "under_verification", label: "Verification", color: "bg-indigo-500" },
  { id: "classified", label: "Classified", color: "bg-purple-500" },
  { id: "assigned", label: "Assigned", color: "bg-cyan-500" },
  { id: "action_plan", label: "Action Plan", color: "bg-teal-500" },
  { id: "intervention", label: "Intervention", color: "bg-orange-500" },
  { id: "monitoring", label: "Monitoring", color: "bg-amber-500" },
  { id: "escalated", label: "Escalated", color: "bg-red-500" },
  { id: "resolved", label: "Resolved", color: "bg-green-500" },
  { id: "closed", label: "Closed", color: "bg-gray-500" },
];

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || "bg-gray-50 text-gray-600"}`;
};

const statusLabel = (status: string) => KANBAN_COLUMNS.find((c) => c.id === status)?.label || status;

const daysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

export default function CasesPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases?pageSize=100")
      .then((r) => r.json())
      .then((d) => { setCases(d.cases || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      key: "province", label: "Province",
      render: (r: any) => <span className="text-gray-500">{r.province?.name || "—"}</span>,
    },
    {
      key: "sector", label: "Sector",
      render: (r: any) => <span className="text-gray-500">{r.sector?.name || "—"}</span>,
    },
    {
      key: "severityLevel", label: "Severity",
      render: (r: any) => <span className={severityBadge(r.severityLevel)}>{r.severityLevel}</span>,
    },
    {
      key: "status", label: "Status",
      render: (r: any) => <span className="text-xs text-gray-500">{statusLabel(r.status)}</span>,
    },
    {
      key: "createdAt", label: "Days",
      render: (r: any) => (
        <span className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          {daysOpen(r.createdAt)}d
        </span>
      ),
    },
    {
      key: "assignedTo", label: "Assigned",
      render: (r: any) => (
        <span className="flex items-center gap-1.5 text-gray-500">
          <User className="w-3 h-3" />
          {r.assignedTo?.name || "Unassigned"}
        </span>
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
          <h1 className="text-xl font-bold text-gray-900">Case Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage service delivery cases</p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${view === "kanban" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
          <Columns className="w-4 h-4" /> Kanban
        </button>
        <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${view === "table" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
          <Table2 className="w-4 h-4" /> Table
        </button>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}

      {/* Kanban */}
      {view === "kanban" && !loading && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map((col) => {
              const colCases = cases.filter((c) => c.status === col.id);
              return (
                <div key={col.id} className="w-64 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="text-xs text-gray-400 ml-auto">{colCases.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colCases.map((c: any) => (
                      <Link key={c.id} href={`/dashboard/cases/${c.id}`}
                        className="block bg-white rounded-lg border border-gray-200 shadow-sm p-3 hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xs font-mono text-blue-600">{c.referenceNumber}</span>
                          <span className={severityBadge(c.severityLevel)}>{c.severityLevel}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{c.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{c.province?.name || "-"}</span>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{daysOpen(c.createdAt)}d</span>
                        </div>
                        {c.assignedTo && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                            <User className="w-3 h-3" />{c.assignedTo.name}
                          </div>
                        )}
                      </Link>
                    ))}
                    {colCases.length === 0 && (
                      <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 text-center">
                        <p className="text-xs text-gray-400">No cases</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      {view === "table" && !loading && (
        <DataTable
          data={cases}
          columns={tableColumns}
          searchPlaceholder="Search by reference, title, province..."
          searchKeys={["referenceNumber", "title", "province", "sector", "severityLevel", "status"]}
        />
      )}
    </div>
  );
}