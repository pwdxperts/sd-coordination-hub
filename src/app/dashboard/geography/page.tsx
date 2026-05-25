"use client";

import { useState, useEffect } from "react";
import { MapPin, Globe, TrendingUp, AlertTriangle, ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Moderate: "bg-amber-500",
  Stable: "bg-green-500",
};

export default function GeographyPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const provinces = stats?.casesByProvince || [];
  const totalProvinces = provinces.length;
  const totalProvinceCases = provinces.reduce((sum: number, p: any) => sum + p.count, 0);
  const mostAffected = provinces.length > 0
    ? provinces.reduce((a: any, b: any) => (a.count > b.count ? a : b))
    : null;
  const maxCount = provinces.length > 0
    ? Math.max(...provinces.map((p: any) => p.count))
    : 0;

  const filteredProvinces = search
    ? provinces.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : provinces;

  // Sort for display (highest first)
  const sortedProvinces = [...filteredProvinces].sort((a, b) => b.count - a.count);

  // Chart data
  const chartData = sortedProvinces.map((p: any) => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + "…" : p.name,
    cases: p.count,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Geographic View</h1>
        <p className="text-sm text-gray-500 mt-0.5">Service delivery cases by province, district, and municipality</p>
      </div>

      {(!stats || provinces.length === 0) ? (
        <div className="text-center py-12">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No geographic data available. Run seed to populate.</p>
        </div>
      ) : (
        <>
          {/* Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Provinces</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{totalProvinces}</p>
              <p className="text-xs text-gray-400 mt-0.5">with active cases</p>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Most Affected</p>
              </div>
              <p className="text-xl font-bold text-orange-600 truncate">{mostAffected?.name || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{mostAffected?.count || 0} cases</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalProvinceCases}</p>
              <p className="text-xs text-gray-400 mt-0.5">across all provinces</p>
            </div>
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Province</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="cases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              placeholder="Search provinces..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* Province Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedProvinces.map((prov: any) => {
              const isExpanded = expandedProvince === prov.id;
              const barWidth = maxCount > 0 ? (prov.count / maxCount) * 100 : 0;

              // Estimate severity breakdown (since API only gives total count per province)
              // We'll compare to total stat for rough breakdown
              const totalCritical = stats?.bySeverity?.critical || 0;
              const totalHigh = stats?.bySeverity?.high || 0;
              const totalModerate = stats?.bySeverity?.moderate || 0;
              const estCritical = totalProvinceCases > 0 ? Math.round((totalCritical / totalProvinceCases) * prov.count) : 0;
              const estHigh = totalProvinceCases > 0 ? Math.round((totalHigh / totalProvinceCases) * prov.count) : 0;
              const estModerate = totalProvinceCases > 0 ? Math.round((totalModerate / totalProvinceCases) * prov.count) : 0;

              return (
                <div key={prov.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <button
                    onClick={() => setExpandedProvince(isExpanded ? null : prov.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{prov.name}</h3>
                      <p className="text-xs text-gray-500">{prov.count} active case{prov.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600 flex-shrink-0">{prov.count}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>

                  {/* Severity bar (compared to max province) */}
                  <div className="px-4 pb-1">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          background: prov.count > (maxCount * 0.5)
                            ? "#dc2626"
                            : prov.count > (maxCount * 0.25)
                            ? "#f59e0b"
                            : "#3b82f6",
                        }}
                      />
                    </div>
                  </div>

                  {/* Severity estimate badges */}
                  <div className="px-4 pb-2 flex gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">{estCritical} critical</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600">{estHigh} high</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600">{estModerate} moderate</span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-2 mt-2">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1.5">Province Summary</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Rank</span>
                            <p className="font-semibold text-gray-900">
                              #{sortedProvinces.findIndex((p: any) => p.id === prov.id) + 1} of {totalProvinces}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Share</span>
                            <p className="font-semibold text-gray-900">
                              {totalProvinceCases > 0 ? ((prov.count / totalProvinceCases) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Severity Index</span>
                            <p className={`font-semibold ${prov.count > 10 ? "text-red-600" : prov.count > 5 ? "text-orange-600" : "text-green-600"}`}>
                              {prov.count > 10 ? "Elevated" : prov.count > 5 ? "Moderate" : "Low"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sortedProvinces.length === 0 && (
              <div className="col-span-full text-center py-12">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {search ? "No provinces match your search" : "No geographic data available"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
