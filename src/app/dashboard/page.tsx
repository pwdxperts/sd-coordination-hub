"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  AlertCircle, TrendingUp, CheckCircle2, Clock, ArrowUpRight,
  Activity, MapPin, Building2, ExternalLink, AlertTriangle,
  CalendarDays, PlusCircle, ClipboardList, Download, FileText,
} from "lucide-react";

const SEVERITY_COLORS = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  Moderate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  Stable: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
};

const PIE_COLORS = ["#dc2626", "#ea580c", "#f59e0b", "#16a34a", "#3b82f6", "#8b5cf6"];

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New Submission", under_verification: "Verification", duplicate: "Duplicate",
  classified: "Classified", assigned: "Assigned", action_plan: "Action Plan",
  intervention: "Intervention", monitoring: "Monitoring", escalated: "Escalated",
  resolved: "Resolved", closed: "Closed", reopened: "Reopened",
};

function exportCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      let val = row[c.key];
      if (val == null) val = "";
      if (typeof val === "object" && val?.name) val = val.name;
      if (typeof val === "string" && val.includes(",")) val = `"${val}"`;
      return val;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    setTodayLabel(
      new Intl.DateTimeFormat("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    );

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportByProvince = useCallback(() => {
    if (!stats?.casesByProvince) return;
    exportCSV(
      stats.casesByProvince,
      `cases-by-province-${new Date().toISOString().split("T")[0]}.csv`,
      [{ key: "name", label: "Province" }, { key: "count", label: "Cases" }]
    );
  }, [stats]);

  const handleExportBySector = useCallback(() => {
    if (!stats?.casesBySector) return;
    exportCSV(
      stats.casesBySector,
      `cases-by-sector-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { key: "name", label: "Sector" },
        { key: "total", label: "Total Cases" },
        { key: "critical", label: "Critical" },
        { key: "high", label: "High" },
        { key: "moderate", label: "Moderate" },
        { key: "stable", label: "Stable" },
      ]
    );
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-500 font-medium">Unable to load dashboard data</h3>
        <p className="text-sm text-gray-400 mt-1">Run the seed API to populate data</p>
      </div>
    );
  }

  const quickActions = [
    { label: "New Case", href: "/dashboard/cases/new", icon: PlusCircle, tone: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { label: "Intake Queue", href: "/dashboard/intake", icon: ClipboardList, tone: "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100" },
    { label: "Executive Brief", href: "/dashboard/executive", icon: FileText, tone: "text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100" },
    { label: "Reports", href: "/dashboard/reports", icon: TrendingUp, tone: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      {/* War Room Header — title + date only */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              {todayLabel}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">War Room</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              National Service Delivery Coordination — priority cases, rapid actions.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${action.tone}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Open Priorities</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.bySeverity.critical + stats.bySeverity.high} critical/high cases
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Resolution Rate</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.totalCases > 0 ? ((stats.resolvedCases / stats.totalCases) * 100).toFixed(1) : "0.0"}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Overdue Cases</p>
            <p className="text-sm font-semibold text-amber-600">{stats.overdueCases}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalCases.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</p>
        </div>

        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">High</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.bySeverity.high}</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.overdueCases}</p>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.resolvedCases}</p>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Esc. Today</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.escalationsDueToday}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Province */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Cases by Province</h3>
            <button
              onClick={handleExportByProvince}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              title="Export CSV"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.casesByProvince} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Sector */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Cases by Sector</h3>
            <button
              onClick={handleExportBySector}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              title="Export CSV"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.casesBySector.filter((s: any) => s.total > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                nameKey="name"
              >
                {stats.casesBySector.filter((s: any) => s.total > 0).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cases by Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stats.casesByStatus.map((item: any) => {
            const statusColors: Record<string, string> = {
              escalated: "text-red-600 bg-red-50 border-red-200",
              intervention: "text-orange-600 bg-orange-50 border-orange-200",
              resolved: "text-green-600 bg-green-50 border-green-200",
              closed: "text-green-700 bg-green-50 border-green-300",
            };
            const color = statusColors[item.status] || "text-gray-600 bg-gray-50 border-gray-200";

            return (
              <div key={item.status} className={`rounded-lg border ${color} p-3 text-center`}>
                <p className="text-lg font-bold">{item.count}</p>
                <p className="text-xs mt-0.5">{STATUS_LABELS[item.status] || item.status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Critical Cases */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Recent Critical & High Cases</h3>
          <Link href="/dashboard/cases" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 px-2">Reference</th>
                <th className="pb-3 px-2">Title</th>
                <th className="pb-3 px-2">Province</th>
                <th className="pb-3 px-2">Sector</th>
                <th className="pb-3 px-2">Severity</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCritical?.map((caseItem: any) => (
                <tr key={caseItem.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2">
                    <Link href={`/dashboard/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                      {caseItem.referenceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2 max-w-[200px] truncate font-medium text-gray-900">
                    {caseItem.title}
                  </td>
                  <td className="py-3 px-2 text-gray-500">{caseItem.province?.name || "-"}</td>
                  <td className="py-3 px-2 text-gray-500">{caseItem.sector?.name || "-"}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      caseItem.severityLevel === "Critical"
                        ? "bg-red-50 text-red-700"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {caseItem.severityLevel}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-500">
                      {STATUS_LABELS[caseItem.status] || caseItem.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-500">
                    {caseItem.assignedTo?.name || "Unassigned"}
                  </td>
                </tr>
              ))}
              {(!stats.recentCritical || stats.recentCritical.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    No critical cases reported
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
