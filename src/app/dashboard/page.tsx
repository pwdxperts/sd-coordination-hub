"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  AlertCircle, TrendingUp, CheckCircle2, Clock, ArrowUpRight,
  Activity, Users, MapPin, Building2, ExternalLink, AlertTriangle,
  CalendarDays, Mail, PhoneCall, PlusCircle, ClipboardList, MessageSquare,
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

const CONTACT_PHONE = "0797224188";
const CONTACT_EMAIL = "pride@pwdxperts.co.za";

const ROLE_LABELS: Record<string, string> = {
  system_admin: "System Admin",
  hub_intake: "Hub Intake",
  hub_analyst: "Hub Analyst",
  provincial_coordinator: "Provincial Coordinator",
  municipal_user: "Municipal User",
  sector_user: "Sector User",
  rapid_response: "Rapid Response",
  executive_viewer: "Executive Viewer",
  minister: "Minister",
  director_general: "Director General",
  national_director: "National Director",
  admin: "Admin",
  intake_officer: "Intake Officer",
};

type CurrentUser = {
  name: string;
  role: string;
};

function hasDashboardStats(data: any) {
  return Boolean(
    data &&
    data.bySeverity &&
    Array.isArray(data.casesByProvince) &&
    Array.isArray(data.casesBySector) &&
    Array.isArray(data.casesByStatus)
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    );
    setTodayLabel(
      new Intl.DateTimeFormat("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    );

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch("/api/dashboard")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (r.status === 401) {
          router.push("/login");
          throw new Error("Please sign in again to view the dashboard.");
        }
        if (!r.ok) throw new Error(data?.error || "Unable to load dashboard data");
        if (!hasDashboardStats(data)) throw new Error("Dashboard data is incomplete. Please reload.");
        return data;
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        setStats(null);
        setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data");
        setLoading(false);
      });
  }, [router]);

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
        <p className="text-sm text-gray-400 mt-1">{errorMessage || "Please reload the dashboard."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Active Cases", value: stats.totalCases, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Critical", value: stats.bySeverity.critical, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { label: "High", value: stats.bySeverity.high, icon: ArrowUpRight, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Overdue", value: stats.overdueCases, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Resolved", value: stats.resolvedCases, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Escalations Today", value: stats.escalationsDueToday, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  const displayName = currentUser?.name || "there";
  const displayRole = currentUser?.role
    ? ROLE_LABELS[currentUser.role] || currentUser.role.replace(/_/g, " ")
    : "Coordination Hub";

  const quickActions = [
    { label: "New Case", href: "/dashboard/cases/new", icon: PlusCircle, tone: "blue" },
    { label: "Intake Queue", href: "/dashboard/intake", icon: ClipboardList, tone: "slate" },
    { label: "Call Pride", href: `tel:${CONTACT_PHONE}`, icon: PhoneCall, tone: "green" },
    { label: "Email Pride", href: `mailto:${CONTACT_EMAIL}`, icon: Mail, tone: "amber" },
    { label: "Reports", href: "/dashboard/reports", icon: MessageSquare, tone: "purple" },
  ];

  const actionStyles: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    slate: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    purple: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  };

  return (
    <div className="space-y-6">
      {/* Command Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 lg:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                {todayLabel}
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="capitalize">{displayRole}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              National War Room status, priority cases, and rapid coordination actions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 xl:justify-end">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${actionStyles[action.tone]}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Duty Phone</p>
            <a href={`tel:${CONTACT_PHONE}`} className="text-sm font-semibold text-gray-900 hover:text-blue-700">
              {CONTACT_PHONE}
            </a>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Duty Email</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-semibold text-gray-900 hover:text-blue-700 break-all">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-500 uppercase">Open Priorities</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.bySeverity.critical + stats.bySeverity.high} critical/high cases
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} shadow-sm p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Province */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Province</h3>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cases by Sector</h3>
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
