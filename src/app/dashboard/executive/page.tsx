"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, AlertTriangle, TrendingUp, AlertCircle, Printer,
  ExternalLink, MapPin, Building2, User, Clock, ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#dc2626", "#ea580c", "#f59e0b", "#16a34a"];

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || "bg-gray-50 text-gray-600"}`;
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    new_submission: "New", under_verification: "Verification", classified: "Classified",
    assigned: "Assigned", action_plan: "Action Plan", intervention: "Intervention",
    monitoring: "Monitoring", escalated: "Escalated", resolved: "Resolved",
    closed: "Closed", reopened: "Reopened",
  };
  return map[s] || s;
};

export default function ExecutivePage() {
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    setGeneratedAt(new Date().toLocaleString("en-ZA"));

    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/cases?pageSize=200").then((r) => r.json()),
    ])
      .then(([dashboardData, casesData]) => {
        setStats(dashboardData);
        setCases(casesData.cases || []);
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-500 font-medium">Unable to load briefing data</h3>
      </div>
    );
  }

  const topProvinces = [...(stats.casesByProvince || [])].sort((a, b) => b.count - a.count);
  const topSectors = [...(stats.casesBySector || [])].sort((a, b) => b.total - a.total);
  const resolvedRate = stats.totalCases > 0
    ? ((stats.resolvedCases / stats.totalCases) * 100).toFixed(1)
    : "0.0";

  // Pie chart: cases by severity
  const severityPie = [
    { name: "Critical", value: stats.bySeverity.critical },
    { name: "High", value: stats.bySeverity.high },
    { name: "Moderate", value: stats.bySeverity.moderate },
    { name: "Stable", value: stats.bySeverity.stable },
  ].filter((s) => s.value > 0);

  // Escalated cases
  const escalatedCases = cases.filter((c: any) => c.escalationLevel && c.escalationLevel !== "none");

  // Recent activity — cases created/updated in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const recentCases = cases.filter((c: any) => new Date(c.createdAt) >= sevenDaysAgo);
  const recentActivity = [
    ...recentCases.map((c: any) => ({
      type: "CASE_CREATED",
      date: c.createdAt,
      caseRef: c.referenceNumber,
      title: c.title,
      user: c.assignedTo?.name || "System",
      severity: c.severityLevel,
    })),
    ...escalatedCases.map((c: any) => ({
      type: "ESCALATED",
      date: c.updatedAt || c.createdAt,
      caseRef: c.referenceNumber,
      title: c.title,
      user: "System",
      severity: c.severityLevel,
      detail: `Escalated to ${c.escalationLevel}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Executive Briefing</h1>
          <p className="text-sm text-gray-500 mt-0.5">National Service Delivery Overview — For DG / Minister</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 no-print"
        >
          <Printer className="w-4 h-4" />
          Print Brief
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 text-white">
        <p className="text-blue-100 text-xs mb-3">Generated {generatedAt}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Total Active</p>
            <p className="text-3xl font-bold mt-1">{stats.totalCases}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Critical</p>
            <p className="text-3xl font-bold mt-1">{stats.bySeverity.critical}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">High</p>
            <p className="text-3xl font-bold mt-1">{stats.bySeverity.high}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-bold mt-1">{stats.resolvedCases}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-blue-100">
          <span>Resolution rate: <strong>{resolvedRate}%</strong></span>
          <span>Overdue: <strong>{stats.overdueCases}</strong></span>
          <span>Escalations today: <strong>{stats.escalationsDueToday}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Severity — Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by Severity</h2>
          {severityPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {severityPie.map((_, index) => (
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
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No severity data</div>
          )}
        </div>

        {/* Cases by Province Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cases by Province</h2>
          <div className="space-y-2">
            {topProvinces.slice(0, 8).map((prov: any, i: number) => {
              const maxVal = topProvinces[0]?.count || 1;
              return (
                <div key={prov.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="text-sm text-gray-700 w-28 truncate">{prov.name}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(prov.count / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{prov.count}</span>
                </div>
              );
            })}
            {topProvinces.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No province data</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Cases List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-700">Critical Cases</h2>
            <span className="text-xs text-gray-400 ml-auto">Top {Math.min(stats.recentCritical?.length || 0, 10)}</span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(stats.recentCritical || [])
              .filter((c: any) => c.severityLevel === "Critical")
              .slice(0, 10)
              .map((caseItem: any, i: number) => (
                <Link
                  key={caseItem.id}
                  href={`/dashboard/cases/${caseItem.id}`}
                  className="flex items-center gap-3 bg-red-50 rounded-lg p-3 hover:bg-red-100 transition-colors group"
                >
                  <span className="text-xs font-bold text-red-400 w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-red-700">{caseItem.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {caseItem.referenceNumber} &middot; {caseItem.province?.name || "—"}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-red-500 flex-shrink-0" />
                </Link>
              ))}
            {(!stats.recentCritical || stats.recentCritical.filter((c: any) => c.severityLevel === "Critical").length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">No critical cases reported</p>
            )}
          </div>
        </div>

        {/* Escalated Cases Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700">Escalated Cases</h2>
          </div>
          {escalatedCases.length > 0 ? (
            <>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {["L1", "L2", "L3", "L4", "L5"].map((level) => {
                  const count = escalatedCases.filter((c: any) => c.escalationLevel === level).length;
                  const levelMap: Record<string, string> = {
                    L1: "Municipal", L2: "Provincial", L3: "Sector", L4: "DG", L5: "Minister",
                  };
                  return (
                    <div key={level} className="text-center bg-gray-50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-900">{count}</p>
                      <p className="text-[10px] text-gray-500">{level}</p>
                      <p className="text-[9px] text-gray-400">{levelMap[level]}</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {escalatedCases.slice(0, 8).map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/cases/${c.id}`}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      c.escalationLevel === "L4" || c.escalationLevel === "L5" ? "bg-red-500" : "bg-orange-400"
                    }`} />
                    <span className="text-xs font-mono text-blue-600">{c.referenceNumber}</span>
                    <span className="text-xs text-gray-700 truncate flex-1">{c.title}</span>
                    <span className="text-[10px] font-medium text-gray-500 flex-shrink-0">{c.escalationLevel}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No escalated cases</p>
              </div>
            </div>
          )}
          {escalatedCases.length > 0 && (
            <Link
              href="/dashboard/escalations"
              className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700"
            >
              View all escalated cases <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-700">Recent Activity (Last 7 Days)</h2>
        </div>
        {recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === "ESCALATED" ? "bg-red-500" : "bg-blue-500"
                } flex-shrink-0`} />
                <span className="text-[11px] text-gray-400 w-24 flex-shrink-0">
                  {new Date(item.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  item.type === "ESCALATED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                } flex-shrink-0`}>
                  {item.type.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono text-blue-600 flex-shrink-0">{item.caseRef}</span>
                <span className="text-xs text-gray-700 truncate flex-1">{item.title}</span>
                {item.detail && <span className="text-[10px] text-orange-600 flex-shrink-0">{item.detail}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        )}
      </div>

      {/* Print footer */}
      <div className="text-center text-xs text-gray-400 no-print">
        <p>Generated {generatedAt} &mdash; National Service Delivery Coordination Hub</p>
      </div>
    </div>
  );
}
