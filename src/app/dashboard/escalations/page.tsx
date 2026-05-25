"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import DataTable from "@/components/DataTable";

const LEVEL_MAP: Record<string, { label: string; badge: string }> = {
  L1: { label: "Municipal Manager", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  L2: { label: "Provincial COGTA", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  L3: { label: "Sector Department", badge: "bg-red-50 text-red-700 border-red-200" },
  L4: { label: "DG / Steerco", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  L5: { label: "Minister", badge: "bg-purple-50 text-purple-700 border-purple-200" },
};

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || ""}`;
};

const daysOpen = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

export default function EscalationsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases?pageSize=200")
      .then((r) => r.json())
      .then((d) => {
        setCases((d.cases || []).filter((c: any) => c.escalationLevel && c.escalationLevel !== "none"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = [
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
      render: (r: any) => <span className="font-medium text-gray-900 max-w-[250px] truncate block">{r.title}</span>,
    },
    {
      key: "province", label: "Province",
      render: (r: any) => <span className="text-gray-500">{r.province?.name || "—"}</span>,
    },
    {
      key: "severityLevel", label: "Severity",
      render: (r: any) => <span className={severityBadge(r.severityLevel)}>{r.severityLevel}</span>,
    },
    {
      key: "escalationLevel", label: "Level",
      render: (r: any) => {
        const es = LEVEL_MAP[r.escalationLevel] || { label: r.escalationLevel, badge: "bg-gray-50 text-gray-600 border-gray-200" };
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${es.badge}`}>{r.escalationLevel}</span>;
      },
    },
    {
      key: "createdAt", label: "Days Open",
      render: (r: any) => <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" />{daysOpen(r.createdAt)}d</span>,
    },
    {
      key: "escalationLevel2", label: "Responsible",
      render: (r: any) => <span className="text-gray-500 text-xs">{LEVEL_MAP[r.escalationLevel]?.label || "—"}</span>,
    },
    {
      key: "id", label: "", sortable: false,
      render: (r: any) => (
        <Link href={`/dashboard/cases/${r.id}`} className="text-blue-400 hover:text-blue-600">
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Escalation Board</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track escalated cases and their response levels</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["L1", "L2", "L3", "L4", "L5"].map((level) => {
          const count = cases.filter((c) => c.escalationLevel === level).length;
          return (
            <div key={level} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{level}</p>
              <p className="text-[10px] text-gray-400">{LEVEL_MAP[level]?.label || ""}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <DataTable
          data={cases}
          columns={columns}
          searchPlaceholder="Search escalated cases..."
          searchKeys={["referenceNumber", "title", "province"]}
        />
      )}
    </div>
  );
}