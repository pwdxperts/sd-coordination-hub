"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowUpRight, Filter, AlertCircle } from "lucide-react";

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  L1: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Municipal Manager" },
  L2: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Provincial COGTA" },
  L3: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Sector Department" },
  L4: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "DG / Steerco" },
  L5: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Minister" },
};

export default function EscalationsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ pageSize: "100" });
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCases((data.cases || []).filter((c: any) => c.escalationLevel && c.escalationLevel !== "none"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filterLevel ? cases.filter((c) => c.escalationLevel === filterLevel) : cases;

  const getDaysSinceOpened = (date: string) => {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusIndicator = (caseItem: any) => {
    const daysOpen = getDaysSinceOpened(caseItem.createdAt);
    if (caseItem.escalationLevel === "L4" || caseItem.escalationLevel === "L5") return "text-red-500";
    if (daysOpen > 30) return "text-red-500";
    if (daysOpen > 14) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escalation Board</h1>
        <p className="text-sm text-gray-500 mt-1">Track escalated cases and their response levels</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        {["L1", "L2", "L3", "L4", "L5"].map((level) => {
          const count = cases.filter((c) => c.escalationLevel === level).length;
          const colors = LEVEL_COLORS[level] || {};
          return (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? "" : level)}
              className={`rounded-xl border p-4 text-center transition-all ${
                filterLevel === level
                  ? `${colors.border} ${colors.bg} ring-2 ring-blue-500`
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <p className={`text-lg font-bold ${colors.text || "text-gray-900"}`}>{count}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{level}</p>
              <p className="text-[10px] text-gray-400">{colors.label}</p>
            </button>
          );
        })}
      </div>

      {/* Escalated Cases */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Province</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Days Open</th>
                <th className="py-3 px-4">Responsible</th>
                <th className="py-3 px-4">Next Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((caseItem: any) => {
                const colors = LEVEL_COLORS[caseItem.escalationLevel] || {};
                const nextLevel: string = {
                  none: "L1", L1: "L2", L2: "L3", L3: "L4", L4: "L5",
                }[caseItem.escalationLevel as string] || "Max";

                return (
                  <tr key={caseItem.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="py-3 px-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusIndicator(caseItem)}`} />
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                        {caseItem.referenceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate font-medium text-gray-900">{caseItem.title}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{caseItem.province?.name || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        caseItem.severityLevel === "Critical" ? "bg-red-50 text-red-700" :
                        caseItem.severityLevel === "High" ? "bg-orange-50 text-orange-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {caseItem.severityLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {caseItem.escalationLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{getDaysSinceOpened(caseItem.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{colors.label}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{nextLevel}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No escalated cases</p>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
