"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, Clock, Activity, MapPin,
  ArrowUpRight, TrendingUp, Inbox, Briefcase, FileText, ExternalLink,
} from "lucide-react";

const SEV_COLORS = { Critical: "#dc2626", High: "#ea580c", Moderate: "#f59e0b", Stable: "#16a34a" };
const STATUS_LABELS: Record<string, string> = {
  new_submission: "New", under_verification: "Verifying", classified: "Classified",
  assigned: "Assigned", action_plan: "Action Plan", intervention: "Intervention",
  monitoring: "Monitoring", escalated: "Escalated", resolved: "Resolved", closed: "Closed",
};

export default function ProvincialDashboard({ stats, user }: { stats: any; user: any }) {
  const prov = stats.scope?.provinceName || "Province";
  const sevData = [
    { name: "Critical", value: stats.bySeverity.critical, color: "#dc2626" },
    { name: "High", value: stats.bySeverity.high, color: "#ea580c" },
    { name: "Moderate", value: stats.bySeverity.moderate, color: "#f59e0b" },
    { name: "Stable", value: stats.bySeverity.stable, color: "#16a34a" },
  ].filter(d => d.value > 0);

  const statusData = (stats.casesByStatus || []).filter((s: any) => s.count > 0);
  const districtData = stats.provincialDetail?.casesByDistrict || [];
  const recentActivity = stats.provincialDetail?.recentActivity || [];
  const resolutionRate = stats.totalCases > 0 ? Math.round((stats.resolvedCases / stats.totalCases) * 100) : 0;

  const statCards = [
    { label: "Total Cases", value: stats.totalCases, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Critical", value: stats.bySeverity.critical, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { label: "Resolved", value: stats.resolvedCases, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Overdue", value: stats.overdueCases, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Escalations", value: stats.escalationsDueToday, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, icon: ArrowUpRight, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-blue-600">{prov} Province</span>
              <span className="text-gray-300">|</span>
              <span>{user?.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{prov} War Room</h1>
            <p className="text-sm text-gray-500 mt-1">Provincial service delivery dashboard — cases scoped to {prov}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/intake" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Inbox className="w-4 h-4" /> Intake Queue
            </Link>
            <Link href="/dashboard/cases" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              <Briefcase className="w-4 h-4" /> Case Board
            </Link>
            <Link href="/dashboard/reports" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
              <FileText className="w-4 h-4" /> Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`bg-white rounded-xl border ${c.border} shadow-sm p-4`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500">{c.label}</p>
                <div className={`w-7 h-7 ${c.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity donut */}
        {sevData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Severity</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={sevData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {sevData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {sevData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                    <span className="font-bold text-gray-900 ml-auto pl-4">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cases by district */}
        {districtData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by District</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={districtData.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Status pipeline */}
      {statusData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Workflow Status</h3>
          <div className="flex flex-wrap gap-2">
            {statusData.map((s: any) => (
              <Link key={s.status} href={`/dashboard/cases?status=${s.status}`}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all">
                <span className="text-xs text-gray-500">{STATUS_LABELS[s.status] || s.status}</span>
                <span className="text-sm font-bold text-gray-900">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sectors breakdown */}
      {stats.casesBySector?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Sector</h3>
          <div className="space-y-2">
            {stats.casesBySector.filter((s: any) => s.total > 0).slice(0, 8).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-40 flex-shrink-0 truncate">{s.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 flex overflow-hidden">
                  {s.critical > 0 && <div className="bg-red-500 h-full" style={{ width: `${(s.critical / s.total) * 100}%` }} title={`Critical: ${s.critical}`} />}
                  {s.high > 0 && <div className="bg-orange-400 h-full" style={{ width: `${(s.high / s.total) * 100}%` }} title={`High: ${s.high}`} />}
                  {s.moderate > 0 && <div className="bg-amber-300 h-full" style={{ width: `${(s.moderate / s.total) * 100}%` }} title={`Moderate: ${s.moderate}`} />}
                  {s.stable > 0 && <div className="bg-green-400 h-full" style={{ width: `${(s.stable / s.total) * 100}%` }} title={`Stable: ${s.stable}`} />}
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Recent Cases</h3>
            <Link href="/dashboard/cases" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View all <ExternalLink className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {recentActivity.slice(0, 10).map((c: any) => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  c.severityLevel === "Critical" ? "bg-red-500" :
                  c.severityLevel === "High" ? "bg-orange-400" :
                  c.severityLevel === "Moderate" ? "bg-amber-400" : "bg-green-400"
                }`} />
                <span className="text-xs font-mono text-gray-400 w-28 flex-shrink-0">{c.referenceNumber}</span>
                <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-blue-700">{c.title}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{c.district?.name || ""}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">{STATUS_LABELS[c.status] || c.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
