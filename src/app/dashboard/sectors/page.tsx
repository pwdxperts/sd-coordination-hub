"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, AlertTriangle, ExternalLink, TrendingUp,
  BarChart3, Activity, CheckCircle2, Search,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Moderate: "#f59e0b",
  Stable: "#16a34a",
};

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || "bg-gray-50 text-gray-600"}`;
};

export default function SectorsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sectors = stats?.casesBySector || [];

  const filteredSectors = search
    ? sectors.filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : sectors;

  // Derived stats
  const totalSectorCases = sectors.reduce((sum: number, s: any) => sum + s.total, 0);
  const sectorWithMostCases = sectors.length > 0
    ? sectors.reduce((a: any, b: any) => (a.total > b.total ? a : b))
    : null;

  // Chart data (critical+high percentage per sector)
  const chartData = sectors
    .filter((s: any) => s.total > 0)
    .map((s: any) => ({
      name: s.name.length > 12 ? s.name.substring(0, 12) + "…" : s.name,
      Critical: s.critical,
      High: s.high,
      Moderate: s.moderate,
      Stable: s.stable,
      total: s.total,
    }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sector View</h1>
        <p className="text-sm text-gray-500 mt-0.5">Service delivery cases organized by sector</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sectors</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{sectors.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalSectorCases} total cases across sectors</p>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Most Affected</p>
              </div>
              <p className="text-xl font-bold text-orange-600 truncate">{sectorWithMostCases?.name || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sectorWithMostCases?.total || 0} cases</p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Cases</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{sectors.reduce((sum: number, s: any) => sum + (s.critical || 0), 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">across all sectors</p>
            </div>
          </div>

          {/* Severity Bar Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Severity Distribution by Sector</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any, name: any) => [value, name]}
                  />
                  <Legend iconSize={8} formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>} />
                  <Bar dataKey="Critical" fill={SEVERITY_COLORS.Critical} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High" fill={SEVERITY_COLORS.High} stackId="a" />
                  <Bar dataKey="Moderate" fill={SEVERITY_COLORS.Moderate} stackId="a" />
                  <Bar dataKey="Stable" fill={SEVERITY_COLORS.Stable} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sectors..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* Sector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSectors.map((sector: any) => {
              const total = sector.total || 0;
              const criticalPct = total > 0 ? ((sector.critical || 0) / total) * 100 : 0;
              const resolvedRate = total > 0 ? ((sector.stable || 0) / total) * 100 : 0;

              return (
                <div key={sector.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">{sector.name}</h3>
                    <span className="text-lg font-bold text-gray-900">{total}</span>
                  </div>

                  {/* Severity breakdown with bars */}
                  <div className="space-y-2 mb-3">
                    {[
                      { label: "Critical", value: sector.critical, color: "bg-red-500" },
                      { label: "High", value: sector.high, color: "bg-orange-500" },
                      { label: "Moderate", value: sector.moderate, color: "bg-amber-500" },
                      { label: "Stable", value: sector.stable, color: "bg-green-500" },
                    ].map((item) => {
                      const pct = total > 0 ? (item.value / total) * 100 : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      {criticalPct.toFixed(0)}% critical
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      {resolvedRate.toFixed(0)}% stable
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredSectors.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {search ? "No sectors match your search" : "No sector data available"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
