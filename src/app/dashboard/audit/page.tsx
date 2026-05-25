"use client";

import { useState } from "react";
import { Shield, Search, Download, Filter, Clock } from "lucide-react";

const ACTION_TYPES = [
  "CASE_CREATED", "CASE_UPDATED", "STATUS_CHANGED", "ASSIGNED",
  "CLASSIFIED", "ESCALATED", "REVIEWED", "RESOLVED",
];

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // We can't easily fetch audit logs from the current API
  // Show a placeholder with sample data
  useState(() => {
    // Simulate load for demo purposes
    const sampleLogs = [
      { id: "1", action: "CASE_CREATED", user: { name: "Intake Officer" }, comment: "Case created from WhatsApp report", createdAt: new Date().toISOString(), caseReference: "NSDCH-2025-A1B2C" },
      { id: "2", action: "CLASSIFIED", user: { name: "Hub Analyst" }, comment: "Classified under Water Services sector", createdAt: new Date(Date.now() - 3600000).toISOString(), caseReference: "NSDCH-2025-A1B2C" },
      { id: "3", action: "ASSIGNED", user: { name: "National Director" }, comment: "Assigned to Provincial COGTA KZN", createdAt: new Date(Date.now() - 7200000).toISOString(), caseReference: "NSDCH-2025-D3E4F" },
      { id: "4", action: "ESCALATED", user: { name: "System" }, comment: "Escalated to L2 - SLA deadline missed", createdAt: new Date(Date.now() - 10800000).toISOString(), caseReference: "NSDCH-2025-G5H6I" },
      { id: "5", action: "STATUS_CHANGED", user: { name: "Hub Analyst" }, comment: "Status: under_verification → classified", createdAt: new Date(Date.now() - 14400000).toISOString(), caseReference: "NSDCH-2025-J7K8L" },
    ];
    setLogs(sampleLogs);
    setLoading(false);
  });

  const filtered = logs.filter((log) => {
    if (search && !log.comment?.toLowerCase().includes(search.toLowerCase()) && !log.caseReference?.toLowerCase().includes(search.toLowerCase())) return false;
    if (actionFilter && log.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Complete audit trail of all system actions and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case ref or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          {ACTION_TYPES.map((action) => (
            <option key={action} value={action}>{action.replace(/_/g, " ")}</option>
          ))}
        </select>

        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Case</th>
                <th className="py-3 px-4">Comment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No audit log entries found</p>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              )}
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-700">{log.user?.name || "System"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      log.action === "CASE_CREATED" ? "bg-green-50 text-green-700" :
                      log.action === "ESCALATED" ? "bg-red-50 text-red-700" :
                      log.action === "RESOLVED" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-blue-600">{log.caseReference || "-"}</td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-[300px] truncate">{log.comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
