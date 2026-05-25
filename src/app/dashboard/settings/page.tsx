"use client";

import { useState } from "react";
import {
  Users, Shield, Building2, Tags, Clock, AlertTriangle,
  Settings2, HardDrive, UserPlus, ToggleLeft,
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");

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
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">User Management</h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <UserPlus className="w-3.5 h-3.5" />
                Add User
              </button>
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
                  <tr className="border-b border-gray-50">
                    <td className="py-2.5 px-3 text-gray-900">Dr. Thandi Modise</td>
                    <td className="py-2.5 px-3 text-gray-500">minister@cogta.gov.za</td>
                    <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">minister</span></td>
                    <td className="py-2.5 px-3 text-gray-500">DCoG - National</td>
                    <td className="py-2.5 px-3"><span className="text-green-600 text-xs font-medium">Active</span></td>
                    <td className="py-2.5 px-3">
                      <button className="text-blue-600 text-xs hover:underline">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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
          </div>
        )}

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

        {!["users", "sla", "escalation"].includes(activeTab) && (
          <div className="text-center py-8">
            <Settings2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} configuration</p>
            <p className="text-xs text-gray-300 mt-1">Configure from the database seed data</p>
          </div>
        )}
      </div>
    </div>
  );
}
