"use client";

import { useState, useEffect } from "react";
import {
  Users, Shield, Building2, Tags, Clock, AlertTriangle,
  Settings2, HardDrive, UserPlus, X, Search, Filter,
  Edit2, UserX, UserCheck, KeyRound, Plus, Trash2,
  Plug, MessageCircle, Mail, CheckCircle, Eye, EyeOff,
  Wifi,
} from "lucide-react";

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "sectors", label: "Sectors", icon: Building2 },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "sla", label: "SLA Config", icon: Clock },
  { id: "escalation", label: "Escalation Rules", icon: AlertTriangle },
  { id: "departments", label: "Departments", icon: Settings2 },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "system", label: "System", icon: HardDrive },
];

const ROLE_OPTIONS = [
  "system_admin","hub_intake","hub_analyst","provincial_coordinator",
  "municipal_user","sector_user","rapid_response","executive_viewer",
  "minister","director_general","national_director","admin","intake_officer",
];

const ROLE_LABELS: Record<string, string> = {
  system_admin:"System Admin",hub_intake:"Hub Intake",hub_analyst:"Hub Analyst",
  provincial_coordinator:"Provincial Coordinator",municipal_user:"Municipal User",
  sector_user:"Sector User",rapid_response:"Rapid Response",executive_viewer:"Executive Viewer",
  minister:"Minister",director_general:"Director General",national_director:"National Director",
  admin:"Admin",intake_officer:"Intake Officer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  system_admin:"Full system access, can manage users and settings",
  hub_intake:"View and verify incoming intake submissions",
  hub_analyst:"Classify, assign, and manage cases across the system",
  provincial_coordinator:"Manage cases within assigned province",
  municipal_user:"Submit action plans and evidence for local cases",
  sector_user:"View sector-specific cases and add comments",
  rapid_response:"Handle assigned cases with progress updates",
  executive_viewer:"Read-only access to dashboards and reports",
  minister:"Ministerial oversight view",
  director_general:"DG-level oversight and escalation authority",
  national_director:"National director access and reporting",
  admin:"Administrative user with moderate permissions",
  intake_officer:"Handle intake submissions and initial triage",
};

const PROVINCES = [
  "Gauteng","KwaZulu-Natal","Western Cape","Eastern Cape",
  "Limpopo","Mpumalanga","North West","Free State","Northern Cape",
];

function Modal({ open, onClose, title, children, footer }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<any[]>([]);
  const [escalationRules, setEscalationRules] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [integrationConfig, setIntegrationConfig] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User tab state
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name:"", email:"", password:"", role:"hub_intake", department:"", province:"" });
  const [editUser, setEditUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name:"", email:"", role:"", department:"", province:"" });
  const [resetPassUser, setResetPassUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sector tab state
  const [showAddSector, setShowAddSector] = useState(false);
  const [editSector, setEditSector] = useState<any>(null);
  const [sectorForm, setSectorForm] = useState({ name:"", description:"" });

  // Category tab state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name:"", sectorId:"", description:"" });

  // SLA tab state
  const [editSla, setEditSla] = useState<any>(null);
  const [slaForm, setSlaForm] = useState({ responseTimeHours:0, resolutionDays:0, escalationAfterHours:0, description:"" });

  // Integration state
  const [intForm, setIntForm] = useState({
    twilio_account_sid:"", twilio_auth_token:"", twilio_whatsapp_number:"",
    smtp_host:"", smtp_port:"465", smtp_user:"", smtp_pass:"", smtp_from:"",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/auth/users").then(r => r.ok ? r.json() : {}),
      fetch("/api/sectors").then(r => r.ok ? r.json() : {}),
      fetch("/api/categories").then(r => r.ok ? r.json() : {}),
      fetch("/api/sla").then(r => r.ok ? r.json() : {}),
      fetch("/api/escalation-rules").then(r => r.ok ? r.json() : {}),
      fetch("/api/departments").then(r => r.ok ? r.json() : {}),
      fetch("/api/config").then(r => r.ok ? r.json() : {}),
    ]).then(([u, sec, cat, sla, rules, depts, cfg]: any[]) => {
      setUsers(Array.isArray(u.users) ? u.users : []);
      setSectors(Array.isArray(sec.sectors) ? sec.sectors : []);
      setCategories(Array.isArray(cat.categories) ? cat.categories : []);
      setSlaConfigs(Array.isArray(sla.sla) ? sla.sla : []);
      setEscalationRules(Array.isArray(rules.rules) ? rules.rules : []);
      setDepartments(Array.isArray(depts.departments) ? depts.departments : []);
      const c = cfg.config || {};
      setIntegrationConfig(c);
      setIntForm(prev => ({ ...prev, ...c }));
      setLoading(false);
    });
  }, []);

  // ─── USER ACTIONS ───
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setSaving(true);
    const res = await fetch("/api/auth/register", {
      method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(newUser),
    });
    if (res.ok) {
      const d = await res.json();
      setUsers(prev => [...prev, d.user || d]);
      setShowAddUser(false);
      setNewUser({ name:"", email:"", password:"", role:"hub_intake", department:"", province:"" });
    }
    setSaving(false);
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    setSaving(true);
    const res = await fetch("/api/auth/users", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: editUser.id, ...editUserForm }),
    });
    if (res.ok) {
      const d = await res.json();
      setUsers(prev => prev.map(u => u.id === d.user.id ? { ...u, ...d.user } : u));
      setEditUser(null);
    }
    setSaving(false);
  };

  const handleToggleActive = async (user: any) => {
    const res = await fetch("/api/auth/users", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: user.id, action: user.active ? "deactivate" : "activate" }),
    });
    if (res.ok) {
      const d = await res.json();
      setUsers(prev => prev.map(u => u.id === d.user.id ? { ...u, ...d.user } : u));
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassUser || newPassword.length < 8) return;
    setSaving(true);
    const res = await fetch("/api/auth/users", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: resetPassUser.id, action:"reset_password", newPassword }),
    });
    if (res.ok) {
      setResetPassUser(null);
      setNewPassword("");
    }
    setSaving(false);
  };

  // ─── SECTOR ACTIONS ───
  const handleAddSector = async () => {
    if (!sectorForm.name) return;
    setSaving(true);
    const res = await fetch("/api/sectors", {
      method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(sectorForm),
    });
    if (res.ok) {
      const d = await res.json();
      setSectors(prev => [...prev, d.sector]);
      setShowAddSector(false);
      setSectorForm({ name:"", description:"" });
    }
    setSaving(false);
  };

  const handleEditSector = async () => {
    if (!editSector) return;
    setSaving(true);
    const res = await fetch(`/api/sectors/${editSector.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(sectorForm),
    });
    if (res.ok) {
      const d = await res.json();
      setSectors(prev => prev.map(s => s.id === d.sector.id ? d.sector : s));
      setEditSector(null);
    }
    setSaving(false);
  };

  const handleDeleteSector = async (id: string) => {
    if (!confirm("Delete this sector? This cannot be undone.")) return;
    const res = await fetch(`/api/sectors/${id}`, { method:"DELETE" });
    if (res.ok) setSectors(prev => prev.filter(s => s.id !== id));
    else { const d = await res.json(); alert(d.error || "Cannot delete sector"); }
  };

  // ─── CATEGORY ACTIONS ───
  const handleAddCategory = async () => {
    if (!categoryForm.name || !categoryForm.sectorId) return;
    setSaving(true);
    const res = await fetch("/api/categories", {
      method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(categoryForm),
    });
    if (res.ok) {
      const d = await res.json();
      setCategories(prev => [...prev, d.category]);
      setShowAddCategory(false);
      setCategoryForm({ name:"", sectorId:"", description:"" });
    }
    setSaving(false);
  };

  const handleEditCategory = async () => {
    if (!editCategory) return;
    setSaving(true);
    const res = await fetch(`/api/categories/${editCategory.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(categoryForm),
    });
    if (res.ok) {
      const d = await res.json();
      setCategories(prev => prev.map(c => c.id === d.category.id ? d.category : c));
      setEditCategory(null);
    }
    setSaving(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method:"DELETE" });
    if (res.ok) setCategories(prev => prev.filter(c => c.id !== id));
    else { const d = await res.json(); alert(d.error || "Cannot delete category"); }
  };

  // ─── SLA ACTIONS ───
  const handleEditSla = async () => {
    if (!editSla) return;
    setSaving(true);
    const res = await fetch(`/api/sla/${editSla.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(slaForm),
    });
    if (res.ok) {
      const d = await res.json();
      setSlaConfigs(prev => prev.map(s => s.id === d.sla.id ? d.sla : s));
      setEditSla(null);
    }
    setSaving(false);
  };

  // ─── INTEGRATION ACTIONS ───
  const handleSaveWhatsApp = async () => {
    setSaving(true);
    await fetch("/api/config", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        twilio_account_sid: intForm.twilio_account_sid,
        twilio_auth_token: intForm.twilio_auth_token,
        twilio_whatsapp_number: intForm.twilio_whatsapp_number,
      }),
    });
    setSaving(false);
    alert("WhatsApp config saved.");
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    await fetch("/api/config", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        smtp_host: intForm.smtp_host,
        smtp_port: intForm.smtp_port,
        smtp_user: intForm.smtp_user,
        smtp_pass: intForm.smtp_pass,
        smtp_from: intForm.smtp_from,
      }),
    });
    setSaving(false);
    alert("Email config saved.");
  };

  // ─── FILTERED USERS ───
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const matchStatus = userStatusFilter === "all" ||
      (userStatusFilter === "active" && u.active !== false) ||
      (userStatusFilter === "inactive" && u.active === false);
    return matchSearch && matchRole && matchStatus;
  });

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
                activeTab === tab.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-700">User Management</h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 w-fit"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="text-xs text-gray-700 bg-transparent border-none outline-none w-40"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 outline-none"
              >
                <option value="all">All Roles</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <select
                value={userStatusFilter}
                onChange={e => setUserStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span className="text-xs text-gray-400 self-center">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
            </div>

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
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-gray-900 font-medium">{u.name}</td>
                      <td className="py-2.5 px-3 text-gray-500">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">{ROLE_LABELS[u.role] || u.role}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{u.department || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.active !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {u.active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditUser(u); setEditUserForm({ name:u.name, email:u.email, role:u.role, department:u.department||"", province:u.province||"" }); }}
                            className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Edit"
                          ><Edit2 className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1 rounded ${u.active !== false ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"}`}
                            title={u.active !== false ? "Deactivate" : "Activate"}
                          >{u.active !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}</button>
                          <button
                            onClick={() => { setResetPassUser(u); setNewPassword(""); }}
                            className="p-1 rounded hover:bg-amber-50 text-amber-600" title="Reset Password"
                          ><KeyRound className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No users match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Sectors</h3>
              <button onClick={() => { setShowAddSector(true); setSectorForm({ name:"", description:"" }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add Sector
              </button>
            </div>
            {sectors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectors.map((s: any) => (
                  <div key={s.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                      {s._count?.cases !== undefined && <p className="text-xs text-blue-600 mt-1">{s._count.cases} case{s._count.cases !== 1 ? "s" : ""}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditSector(s); setSectorForm({ name:s.name, description:s.description||"" }); }}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteSector(s.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No sectors yet. Add your first sector above.</div>
            )}
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Failure Categories</h3>
              <button onClick={() => { setShowAddCategory(true); setCategoryForm({ name:"", sectorId:"", description:"" }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((c: any) => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.sector?.name && <p className="text-xs text-gray-400 mt-0.5">{c.sector.name}</p>}
                      {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditCategory(c); setCategoryForm({ name:c.name, sectorId:c.sectorId||"", description:c.description||"" }); }}
                        className="p-1 rounded hover:bg-blue-50 text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCategory(c.id)}
                        className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No categories yet. Add your first category above.</div>
            )}
          </div>
        )}

        {/* ─── SLA TAB ─── */}
        {activeTab === "sla" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">SLA Configuration</h3>
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
                  {(slaConfigs.length > 0 ? slaConfigs : [
                    { id:"_c",severityLevel:"Critical",responseTimeHours:4,resolutionDays:3,escalationAfterHours:24,description:"Critical infrastructure failures" },
                    { id:"_h",severityLevel:"High",responseTimeHours:8,resolutionDays:7,escalationAfterHours:48,description:"High-impact service disruptions" },
                    { id:"_m",severityLevel:"Moderate",responseTimeHours:24,resolutionDays:14,escalationAfterHours:72,description:"Moderate service issues" },
                    { id:"_s",severityLevel:"Stable",responseTimeHours:48,resolutionDays:30,escalationAfterHours:120,description:"Stable lower-priority issues" },
                  ]).map((sla: any) => (
                    <tr key={sla.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sla.severityLevel==="Critical"?"bg-red-50 text-red-700":
                          sla.severityLevel==="High"?"bg-orange-50 text-orange-700":
                          sla.severityLevel==="Moderate"?"bg-amber-50 text-amber-700":"bg-green-50 text-green-700"
                        }`}>{sla.severityLevel}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-900">{sla.responseTimeHours}h</td>
                      <td className="py-2.5 px-3 text-gray-900">{sla.resolutionDays} days</td>
                      <td className="py-2.5 px-3 text-gray-900">{sla.escalationAfterHours}h</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs max-w-[200px]">{sla.description || "-"}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            if (!sla.id.startsWith("_")) {
                              setEditSla(sla);
                              setSlaForm({ responseTimeHours:sla.responseTimeHours, resolutionDays:sla.resolutionDays, escalationAfterHours:sla.escalationAfterHours, description:sla.description||"" });
                            } else {
                              alert("Seed this SLA config into the database first via /api/seed");
                            }
                          }}
                          className="text-blue-600 text-xs hover:underline flex items-center gap-1"
                        ><Edit2 className="w-3 h-3" />Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  {(escalationRules.length > 0 ? escalationRules : [
                    { name:"Missed SLA",condition:"missed_sla",severityMin:"Moderate",escalateTo:"L1",afterHours:24,enabled:true },
                    { name:"No Action Plan",condition:"no_action_plan",severityMin:"Moderate",escalateTo:"L1",afterHours:72,enabled:true },
                    { name:"Safety Risk",condition:"safety_risk",severityMin:"High",escalateTo:"L2",afterHours:12,enabled:true },
                    { name:"Recurring Failure",condition:"recurring",severityMin:"Moderate",escalateTo:"L2",afterHours:48,enabled:true },
                    { name:"Protest/Media",condition:"protest_media",severityMin:"High",escalateTo:"L3",afterHours:8,enabled:true },
                    { name:"Critical Infra",condition:"missed_sla",severityMin:"Critical",escalateTo:"L3",afterHours:12,enabled:true },
                  ]).map((rule: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 text-gray-900">{rule.name}</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{rule.condition}</span></td>
                      <td className="py-2.5 px-3">{rule.severityMin}</td>
                      <td className="py-2.5 px-3 font-medium">{rule.escalateTo}</td>
                      <td className="py-2.5 px-3">{rule.afterHours}h</td>
                      <td className="py-2.5 px-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={rule.enabled} readOnly className="sr-only peer" />
                          <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {["DCoG - National","DWS - Water & Sanitation","DMRE - Energy","DPWI - Public Works","Provincial COGTA - GP","Provincial COGTA - KZN"].map((name, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{i < 4 ? "National" : "Provincial"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── INTEGRATIONS TAB ─── */}
        {activeTab === "integrations" && (
          <div className="space-y-8">
            <h3 className="text-sm font-semibold text-gray-700">Integration Configuration</h3>

            {/* WhatsApp */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">WhatsApp Business (Twilio)</p>
                  <p className="text-xs text-gray-500">Receive and process service delivery reports via WhatsApp</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${integrationConfig.twilio_account_sid ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {integrationConfig.twilio_account_sid ? "Configured" : "Not configured"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Twilio Account SID">
                  <input type="text" value={intForm.twilio_account_sid} onChange={e => setIntForm({...intForm, twilio_account_sid:e.target.value})} className={inputCls} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                </Field>
                <Field label="Twilio Auth Token">
                  <input type="password" value={intForm.twilio_auth_token} onChange={e => setIntForm({...intForm, twilio_auth_token:e.target.value})} className={inputCls} placeholder="Your auth token" />
                </Field>
                <Field label="WhatsApp Business Number">
                  <input type="text" value={intForm.twilio_whatsapp_number} onChange={e => setIntForm({...intForm, twilio_whatsapp_number:e.target.value})} className={inputCls} placeholder="whatsapp:+14155238886" />
                </Field>
                <Field label="Webhook URL (read-only)">
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/intake/whatsapp`} className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`} />
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/intake/whatsapp`)} className="text-xs text-blue-600 whitespace-nowrap hover:underline">Copy</button>
                  </div>
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleSaveWhatsApp} disabled={saving} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save WhatsApp Config"}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email Integration (SMTP)</p>
                  <p className="text-xs text-gray-500">Configure email intake and outbound notifications</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${integrationConfig.smtp_host ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {integrationConfig.smtp_host ? "Configured" : "Not configured"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <input type="text" value={intForm.smtp_host} onChange={e => setIntForm({...intForm, smtp_host:e.target.value})} className={inputCls} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="SMTP Port">
                  <input type="number" value={intForm.smtp_port} onChange={e => setIntForm({...intForm, smtp_port:e.target.value})} className={inputCls} placeholder="465" />
                </Field>
                <Field label="Username / Email">
                  <input type="text" value={intForm.smtp_user} onChange={e => setIntForm({...intForm, smtp_user:e.target.value})} className={inputCls} placeholder="intake@cogta.gov.za" />
                </Field>
                <Field label="Password / App Password">
                  <input type="password" value={intForm.smtp_pass} onChange={e => setIntForm({...intForm, smtp_pass:e.target.value})} className={inputCls} placeholder="App password" />
                </Field>
                <Field label="From Address">
                  <input type="email" value={intForm.smtp_from} onChange={e => setIntForm({...intForm, smtp_from:e.target.value})} className={inputCls} placeholder="noreply@cogta.gov.za" />
                </Field>
                <Field label="Email Intake Webhook (read-only)">
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/intake/email`} className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`} />
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/intake/email`)} className="text-xs text-blue-600 whitespace-nowrap hover:underline">Copy</button>
                  </div>
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleSaveEmail} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Email Config"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── SYSTEM TAB ─── */}
        {activeTab === "system" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label:"Platform", value:"National Service Delivery Coordination Hub" },
                { label:"Version", value:"1.0.0" },
                { label:"Database", value:"PostgreSQL via Prisma" },
                { label:"Authentication", value:"Email + Password + MFA (TOTP)" },
                { label:"Session Duration", value:"8 hours" },
                { label:"Task Management", value:"Enabled" },
              ].map((sys, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{sys.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{sys.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}

      {/* Add User */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Add User"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddUser(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={handleAddUser} disabled={saving || !newUser.name || !newUser.email || !newUser.password}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Adding..." : "Add User"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Name *"><input type="text" value={newUser.name} onChange={e => setNewUser({...newUser,name:e.target.value})} className={inputCls} placeholder="Full name" /></Field>
          <Field label="Email *"><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser,email:e.target.value})} className={inputCls} placeholder="user@example.com" /></Field>
          <Field label="Password *"><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser,password:e.target.value})} className={inputCls} placeholder="Min 8 chars" /></Field>
          <Field label="Role">
            <select value={newUser.role} onChange={e => setNewUser({...newUser,role:e.target.value})} className={inputCls}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Department"><input type="text" value={newUser.department} onChange={e => setNewUser({...newUser,department:e.target.value})} className={inputCls} placeholder="e.g. DCoG - National" /></Field>
          <Field label="Province">
            <select value={newUser.province} onChange={e => setNewUser({...newUser,province:e.target.value})} className={inputCls}>
              <option value="">Select province</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Edit User */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit User — ${editUser?.name || ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={handleEditUser} disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Name"><input type="text" value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm,name:e.target.value})} className={inputCls} /></Field>
          <Field label="Email"><input type="email" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm,email:e.target.value})} className={inputCls} /></Field>
          <Field label="Role">
            <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm,role:e.target.value})} className={inputCls}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Department"><input type="text" value={editUserForm.department} onChange={e => setEditUserForm({...editUserForm,department:e.target.value})} className={inputCls} placeholder="Department name" /></Field>
          <Field label="Province">
            <select value={editUserForm.province} onChange={e => setEditUserForm({...editUserForm,province:e.target.value})} className={inputCls}>
              <option value="">Select province</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Reset Password */}
      <Modal open={!!resetPassUser} onClose={() => setResetPassUser(null)} title={`Reset Password — ${resetPassUser?.name || ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setResetPassUser(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={handleResetPassword} disabled={saving || newPassword.length < 8}
              className="px-4 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Set a new password for <strong>{resetPassUser?.name}</strong>. They will need to use this password on their next login.</p>
          <Field label="New Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`${inputCls} pr-10`}
                placeholder="Min 8 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-red-500">Password must be at least 8 characters</p>
          )}
        </div>
      </Modal>

      {/* Add/Edit Sector */}
      <Modal open={showAddSector || !!editSector} onClose={() => { setShowAddSector(false); setEditSector(null); }}
        title={editSector ? "Edit Sector" : "Add Sector"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAddSector(false); setEditSector(null); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={editSector ? handleEditSector : handleAddSector} disabled={saving || !sectorForm.name}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : editSector ? "Save Changes" : "Add Sector"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Sector Name *"><input type="text" value={sectorForm.name} onChange={e => setSectorForm({...sectorForm,name:e.target.value})} className={inputCls} placeholder="e.g. Water Services" /></Field>
          <Field label="Description">
            <textarea value={sectorForm.description} onChange={e => setSectorForm({...sectorForm,description:e.target.value})} className={`${inputCls} resize-none`} rows={3} placeholder="Brief description of this sector" />
          </Field>
        </div>
      </Modal>

      {/* Add/Edit Category */}
      <Modal open={showAddCategory || !!editCategory} onClose={() => { setShowAddCategory(false); setEditCategory(null); }}
        title={editCategory ? "Edit Category" : "Add Category"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAddCategory(false); setEditCategory(null); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={editCategory ? handleEditCategory : handleAddCategory} disabled={saving || !categoryForm.name || !categoryForm.sectorId}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : editCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Category Name *"><input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm,name:e.target.value})} className={inputCls} placeholder="e.g. Infrastructure Failure" /></Field>
          <Field label="Sector *">
            <select value={categoryForm.sectorId} onChange={e => setCategoryForm({...categoryForm,sectorId:e.target.value})} className={inputCls}>
              <option value="">Select sector</option>
              {sectors.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm,description:e.target.value})} className={`${inputCls} resize-none`} rows={2} placeholder="Description" />
          </Field>
        </div>
      </Modal>

      {/* Edit SLA */}
      <Modal open={!!editSla} onClose={() => setEditSla(null)} title={`Edit SLA — ${editSla?.severityLevel || ""}`}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditSla(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={handleEditSla} disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save SLA"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Response Time (hours)">
            <input type="number" min={1} value={slaForm.responseTimeHours} onChange={e => setSlaForm({...slaForm,responseTimeHours:Number(e.target.value)})} className={inputCls} />
          </Field>
          <Field label="Resolution Days">
            <input type="number" min={1} value={slaForm.resolutionDays} onChange={e => setSlaForm({...slaForm,resolutionDays:Number(e.target.value)})} className={inputCls} />
          </Field>
          <Field label="Escalation After (hours)">
            <input type="number" min={1} value={slaForm.escalationAfterHours} onChange={e => setSlaForm({...slaForm,escalationAfterHours:Number(e.target.value)})} className={inputCls} />
          </Field>
          <Field label="Description">
            <input type="text" value={slaForm.description} onChange={e => setSlaForm({...slaForm,description:e.target.value})} className={inputCls} placeholder="Optional description" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
