"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Columns, Table2, Plus, Search, Filter, ChevronDown,
  MoreHorizontal, Clock, AlertCircle, ExternalLink,
} from "lucide-react";

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

const SEVERITY_BADGES: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-green-50 text-green-700 border-green-200",
};

export default function CasesPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ pageSize: "100" });
    if (search) params.set("search", search);

    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  const getDaysOpen = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Board</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage service delivery cases</p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${
              view === "kanban" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Columns className="w-4 h-4" />
            Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all ${
              view === "table" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Table2 className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Kanban View */}
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
                    {colCases.map((caseItem: any) => (
                      <Link
                        key={caseItem.id}
                        href={`/dashboard/cases/${caseItem.id}`}
                        className="block bg-white rounded-lg border border-gray-200 shadow-sm p-3 hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xs font-mono text-blue-600">{caseItem.referenceNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            SEVERITY_BADGES[caseItem.severityLevel] || "bg-gray-50 text-gray-600"
                          }`}>
                            {caseItem.severityLevel}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{caseItem.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{caseItem.province?.name || "-"}</span>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDaysOpen(caseItem.createdAt)}d
                          </span>
                        </div>
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

      {/* Table View */}
      {view === "table" && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                        {caseItem.referenceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-[250px] truncate font-medium text-gray-900">{caseItem.title}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{caseItem.province?.name || "-"}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{caseItem.sector?.name || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        SEVERITY_BADGES[caseItem.severityLevel] || "bg-gray-50 text-gray-600"
                      }`}>
                        {caseItem.severityLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500">
                        {KANBAN_COLUMNS.find((c) => c.id === caseItem.status)?.label || caseItem.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{getDaysOpen(caseItem.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{caseItem.assignedTo?.name || "Unassigned"}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-700">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                      No cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
