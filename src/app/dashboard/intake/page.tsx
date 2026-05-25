"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Filter, ChevronDown, CheckCircle, XCircle,
  AlertCircle, Merge, Eye, Users, MessageSquare,
} from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", email: "Email", manual: "Manual Entry",
  municipal_report: "Municipal Report", public: "Public Portal",
};

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New", under_verification: "Verifying", duplicate: "Duplicate",
  rejected: "Rejected", classified: "Classified", assigned: "Assigned",
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700", High: "bg-orange-100 text-orange-700",
  Moderate: "bg-amber-100 text-amber-700", Stable: "bg-green-100 text-green-700",
};

const TABS = [
  { id: "all", label: "All Submissions" },
  { id: "new_submission", label: "New" },
  { id: "under_verification", label: "Under Verification" },
  { id: "duplicate", label: "Duplicates" },
  { id: "rejected", label: "Rejected" },
  { id: "classified", label: "Classified" },
];

export default function IntakeQueuePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [provinces, setProvinces] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [filters, setFilters] = useState({ provinceId: "", sectorId: "", channel: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("status", activeTab);
    if (search) params.set("search", search);
    if (filters.provinceId) params.set("provinceId", filters.provinceId);
    if (filters.sectorId) params.set("sectorId", filters.sectorId);

    fetch(`/api/cases?${params}&pageSize=50`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab, search, filters]);

  useEffect(() => {
    fetch("/api/cases?pageSize=1").then(async (r) => {
      const data = await r.json();
      if (data.cases?.length > 0) {
        // We already have data from other fetches
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intake Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review, verify, and classify incoming service delivery reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reference or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <select
          value={filters.provinceId}
          onChange={(e) => setFilters({ ...filters, provinceId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Provinces</option>
          {provinces.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filters.sectorId}
          onChange={(e) => setFilters({ ...filters, sectorId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sectors</option>
          {sectors.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Province</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem: any) => (
                <tr key={caseItem.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                      {caseItem.referenceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-gray-600">
                      {CHANNEL_LABELS[caseItem.intakeChannel] || caseItem.intakeChannel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600">{caseItem.province?.name || "-"}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{caseItem.sector?.name || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      SEVERITY_COLORS[caseItem.severityLevel] || "bg-gray-100 text-gray-600"
                    }`}>
                      {caseItem.severityLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-gray-500">
                      {STATUS_LABELS[caseItem.status] || caseItem.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Verify">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-orange-50 text-orange-600" title="Classify">
                        <Filter className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-purple-50 text-purple-600" title="Merge">
                        <Merge className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No submissions in this queue</p>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
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
