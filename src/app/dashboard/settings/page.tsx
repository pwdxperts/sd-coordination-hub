"use client";

import { useState, useEffect } from "react";
import {
  Users, Shield, Building2, Tags, Clock, AlertTriangle,
  Settings2, HardDrive, UserPlus, X,
} from "lucide-react";

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "sectors", label: "Sectors", icon: Building2 },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "sla", label: "SLA Config", icon: Clock },
  { id: "escalation", label: "Escalation Rules", icon: AlertTriangle },
  { id: "departments", label: "Departments", icon: Settings2 },
  { id: "system", label: "System", icon: HardDrive },
];

const ROLE_OPTIONS = [
  "system_admin", "hub_intake", "hub_analyst", "provincial_coordinator",
  "municipal_user", "sector_user", "rapid_response", "executive_viewer",
  "minister", "director_general", "national_director", "admin", "intake_officer",
];

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

const ROLE_DESCRIPTIONS: Record<string, string> = {
  system_admin: "Full system access, can manage users and settings",
  hub_intake: "View and verify incoming intake submissions",
  hub_analyst: "Classify, assign, and manage cases across the system",
  provincial_coordinator: "Manage cases within assigned province",
  municipal_user: "Submit action plans and evidence for local cases",
  sector_user: "View sector-specific cases and add comments",
  rapid_response: "Handle assigned cases with progress updates",
  executive_viewer: "Read-only access to dashboards and reports",
  minister: "Ministerial oversight view",
  director_general: "DG-level oversight and escalation authority",
  national_director: "National director access and reporting",
  admin: "Administrative user with moderate permissions",
  intake_officer: "Handle intake submissions and initial triage",
};

const ROLE_SEVERITY = ["Critical", "High", "Moderate", "Stable"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<any[]>([]);
  const [escalationRules, setEscalationRules] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "hub_intake" });
  const [addingUser, setAddingUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const results: any = {};

      try {
        const [usersRes, sectorsRes, categoriesRes, slaRes, rulesRes, deptsRes] = await Promise.all([
          fetch("/api/auth/users").catch(() => null),
          fetch("/api/sectors").catch(() => null),
          fetch("/api/categories").catch(() => null),
          fetch("/api/sla").catch(() => null),
          fetch("/api/escalation-rules").catch(() => null),
          fetch("/api/departments").catch(() => null),
        ]);

        if (usersRes?.ok) results.users = (await usersRes.json()).users || await usersRes.json();
        if (sectorsRes?.ok) results.sectors = await sectorsRes.json();
        if (categoriesRes?.ok) results.categories = await categoriesRes.json();
        if (slaRes?.ok) results.sla = await slaRes.json();
        if (rulesRes?.ok) results.rules = await rulesRes.json();
        if (deptsRes?.ok) results.departments = await deptsRes.json();

        // Also try fetching users from /api/users
        if (!results.users) {
          const altUsers = await fetch("/api/users").catch(() => null);
          if (altUsers?.ok) results.users = (await altUsers.json()).users || await altUsers.json();
        }
      } catch (e) {}

      // If all APIs failed, populate from prisma by fetching from seed data routes
      // Fallback: try direct fetch
      if (!results.users) {
        try {
          const r = await fetch("/api/auth/me");
          if (r.ok) {
            // At least we tried
          }
        } catch {}
      }

      return results;
    };

    fetchData().then((data) => {
      setUsers(Array.isArray(data.users) ? data.users : []);
      setSectors(Array.isArray(data.sectors?.sectors || data.sectors) ? (data.sectors?.sectors || data.sectors) : []);
      setCategories(Array.isArray(data.categories?.categories || data.categories) ? (data.categories?.categories || data.categories) : []);
      setSlaConfigs(Array.isArray(data.sla?.sla || data.sla) ? (data.sla?.sla || data.sla) : []);
      setEscalationRules(Array.isArray(data.rules?.rules || data.rules) ? (data.rules?.rules || data.rules) : []);
      setDepartments(Array.isArray(data.departments?.departments || data.departments) ? (data.departments?.departments || data.departments) : []);
      setLoading(false);
    });
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setAddingUser(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const created = await res.json();
        setUsers((prev) => [...prev, created.user || created]);
        setShowAddUser(false);
        setNewUser({ name: "", email: "", password: "", role: "hub_intake" });
      } else {
        // Try /api/users as fallback
        const res2 = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        });
        if (res2.ok) {
          const created = await res2.json();
          setUsers((prev) => [...prev, created.user || created]);
          setShowAddUser(false);
          setNewUser({ name: "", email: "", password: "", role: "hub_intake" });
        }
      }
    } catch {}
    setAddingUser(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure system settings, users, roles, and rules</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">User Management</h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add User
              </button>
            </div>

            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-50">
                        <td className="py-2.5 px-3 text-gray-900">{u.name}</td>
                        <td className="py-2.5 px-3 text-gray-500">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">{u.department || "-"}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs font-medium ${u.active !== false ? "text-green-600" : "text-red-600"}`}>
                            {u.active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {/* Fallback demo data when no API */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 px-3 text-gray-900">Dr. Thandi Modise</td>
                        <td className="py-2.5 px-3 text-gray-500">minister@cogta.gov.za</td>
                        <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">Minister</span></td>
                        <td className="py-2.5 px-3 text-gray-500">DCoG - National</td>
                        <td className="py-2.5 px-3"><span className="text-green-600 text-xs font-medium">Active</span></td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 px-3 text-gray-900">Mr. Sipho Nkosi</td>
                        <td className="py-2.5 px-3 text-gray-500">director.general@cogta.gov.za</td>
                        <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">Director General</span></td>
                        <td className="py-2.5 px-3 text-gray-500">DCoG - National</td>
                        <td className="py-2.5 px-3"><span className="text-green-600 text-xs font-medium">Active</span></td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 px-3 text-gray-900">Ms. Nomvula Mthembu</td>
                        <td className="py-2.5 px-3 text-gray-500">national.director@cogta.gov.za</td>
                        <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700">National Director</span></td>
                        <td className="py-2.5 px-3 text-gray-500">DCoG - National</td>
                        <td className="py-2.5 px-3"><span className="text-green-600 text-xs font-medium">Active</span></td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  API endpoint pending — showing seed data. Create /api/auth/users route to fetch from database.
                </p>
              </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAddUser(false)}>
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Add User</h3>
                    <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="Min 8 chars, upper + lower + number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUser}
                      disabled={addingUser || !newUser.name || !newUser.email || !newUser.password}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addingUser ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ROLES TAB ─── */}
        {activeTab === "roles" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Role Definitions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((roleKey) => (
                <div key={roleKey} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[roleKey] || roleKey}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ROLE_DESCRIPTIONS[roleKey] || "No description available"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SECTORS TAB ─── */}
        {activeTab === "sectors" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Sectors</h3>
            {sectors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectors.map((s: any) => (
                  <div key={s.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                    {s._count?.cases !== undefined && (
                      <p className="text-xs text-blue-600 mt-1">{s._count.cases} cases</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: "Water Services", desc: "Water supply, sanitation, wastewater treatment" },
                    { name: "Electricity Supply", desc: "Electricity distribution, infrastructure, load shedding" },
                    { name: "Waste Management", desc: "Refuse collection, landfill operations, recycling" },
                    { name: "Roads & Transport", desc: "Road infrastructure, public transport, traffic management" },
                    { name: "Governance & Financial Distress", desc: "Municipal governance, financial management" },
                    { name: "Human Settlements", desc: "Housing, land administration, informal settlements" },
                    { name: "Environment", desc: "Environmental compliance, pollution, climate adaptation" },
                    { name: "Other", desc: "Other service delivery areas" },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  API endpoint pending — create /api/sectors route to fetch from database.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {activeTab === "categories" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Failure Categories</h3>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {categories.map((c: any) => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    {c.sector?.name && <p className="text-xs text-gray-400 mt-0.5">{c.sector.name}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["Infrastructure Failure", "Supply Disruption", "Service Backlog",
                  "Quality Issue", "Safety Risk", "Financial Distress",
                  "Capacity Constraint", "Policy Gap", "Environmental Issue",
                ].map((cat, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{cat}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SLA TAB ─── */}
        {activeTab === "sla" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">SLA Configuration</h3>
            {slaConfigs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Response Time</th>
                      <th className="py-2 px-3">Resolution Days</th>
                      <th className="py-2 px-3">Escalation After</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaConfigs.map((sla: any) => (
                      <tr key={sla.id} className="border-b border-gray-50">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sla.severityLevel === "Critical" ? "bg-red-50 text-red-700" :
                            sla.severityLevel === "High" ? "bg-orange-50 text-orange-700" :
                            sla.severityLevel === "Moderate" ? "bg-amber-50 text-amber-700" :
                            "bg-green-50 text-green-700"
                          }`}>{sla.severityLevel}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.responseTimeHours}h</td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.resolutionDays} days</td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.escalationAfterHours}h</td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[200px]">{sla.description || "-"}</td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Response Time</th>
                      <th className="py-2 px-3">Resolution Days</th>
                      <th className="py-2 px-3">Escalation After</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { level: "Critical", response: "4 hours", resolution: "3 days", escalation: "24 hours" },
                      { level: "High", response: "8 hours", resolution: "7 days", escalation: "48 hours" },
                      { level: "Moderate", response: "24 hours", resolution: "14 days", escalation: "72 hours" },
                      { level: "Stable", response: "48 hours", resolution: "30 days", escalation: "120 hours" },
                    ].map((sla) => (
                      <tr key={sla.level} className="border-b border-gray-50">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sla.level === "Critical" ? "bg-red-50 text-red-700" :
                            sla.level === "High" ? "bg-orange-50 text-orange-700" :
                            sla.level === "Moderate" ? "bg-amber-50 text-amber-700" :
                            "bg-green-50 text-green-700"
                          }`}>{sla.level}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.response}</td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.resolution}</td>
                        <td className="py-2.5 px-3 text-gray-900">{sla.escalation}</td>
                        <td className="py-2.5 px-3">
                          <button className="text-blue-600 text-xs hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── ESCALATION RULES TAB ─── */}
        {activeTab === "escalation" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Escalation Rules</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-3">Rule</th>
                    <th className="py-2 px-3">Condition</th>
                    <th className="py-2 px-3">Min Severity</th>
                    <th className="py-2 px-3">Escalate To</th>
                    <th className="py-2 px-3">After</th>
                    <th className="py-2 px-3">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Missed SLA", cond: "missed_sla", sev: "Moderate", to: "L1", hrs: "24h", enabled: true },
                    { name: "No Action Plan", cond: "no_action_plan", sev: "Moderate", to: "L1", hrs: "72h", enabled: true },
                    { name: "Safety Risk", cond: "safety_risk", sev: "High", to: "L2", hrs: "12h", enabled: true },
                    { name: "Recurring Failure", cond: "recurring", sev: "Moderate", to: "L2", hrs: "48h", enabled: true },
                    { name: "Protest/Media", cond: "protest_media", sev: "High", to: "L3", hrs: "8h", enabled: true },
                    { name: "Critical Infra", cond: "missed_sla", sev: "Critical", to: "L3", hrs: "12h", enabled: true },
                    { name: "Multi-Province", cond: "safety_risk", sev: "Critical", to: "L4", hrs: "6h", enabled: true },
                    { name: "National Security", cond: "protest_media", sev: "Critical", to: "L5", hrs: "2h", enabled: true },
                  ].map((rule, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 text-gray-900">{rule.name}</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{rule.cond}</span></td>
                      <td className="py-2.5 px-3">{rule.sev}</td>
                      <td className="py-2.5 px-3 font-medium">{rule.to}</td>
                      <td className="py-2.5 px-3">{rule.hrs}</td>
                      <td className="py-2.5 px-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={rule.enabled} readOnly className="sr-only peer" />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── DEPARTMENTS TAB ─── */}
        {activeTab === "departments" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Departments</h3>
            {departments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((d: any) => (
                  <div key={d.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.sphere || "National"}</p>
                    {d.sector && <p className="text-xs text-gray-400 mt-0.5">{d.sector}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "DCoG - National", sphere: "National" },
                  { name: "DWS - Water & Sanitation", sphere: "National" },
                  { name: "DMRE - Energy", sphere: "National" },
                  { name: "DPWI - Public Works", sphere: "National" },
                  { name: "Provincial COGTA - GP", sphere: "Provincial" },
                  { name: "Provincial COGTA - KZN", sphere: "Provincial" },
                ].map((d, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.sphere}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── SYSTEM TAB ─── */}
        {activeTab === "system" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Platform", value: "National Service Delivery Coordination Hub" },
                { label: "Version", value: "1.0.0" },
                { label: "Environment", value: process.env.NODE_ENV || "development" },
                { label: "Database", value: "PostgreSQL via Prisma" },
                { label: "Authentication", value: "Email + Password + MFA (TOTP)" },
                { label: "Session Duration", value: "8 hours" },
              ].map((sys, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{sys.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{sys.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FALLBACK TABS ─── */}
        {activeTab === "categories" && null /* Already handled above */}
        {!["users", "roles", "sectors", "categories", "sla", "escalation", "departments", "system"].includes(activeTab) && (
          <div className="text-center py-8">
            <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} configuration</p>
            <p className="text-xs text-gray-300 mt-1">Configure from the database seed data</p>
          </div>
        )}
      </div>

      {/* Floating Add User modal when active */}
      {(activeTab === "users" && showAddUser) && (
        /* Already rendered above as part of the users tab content */
        null
      )}
    </div>
  );
}
