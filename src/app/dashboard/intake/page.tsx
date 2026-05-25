"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Filter, Merge, MessageSquare } from "lucide-react";
import DataTable from "@/components/DataTable";

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", email: "Email", manual: "Manual Entry",
  municipal_report: "Municipal Report", public: "Public Portal",
};

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New", under_verification: "Verifying", duplicate: "Duplicate",
  rejected: "Rejected", classified: "Classified", assigned: "Assigned",
};

const severityBadge = (level: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Stable: "bg-green-50 text-green-700 border-green-200",
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[level] || "bg-gray-50 text-gray-600"}`;
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("status", activeTab);
    params.set("pageSize", "100");
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((d) => { setCases(d.cases || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const columns = [
    {
      key: "referenceNumber", label: "Reference",
      render: (r: any) => (
        <Link href={`/dashboard/cases/${r.id}`} className="text-blue-600 hover:text-blue-700 font-mono text-xs font-medium">
          {r.referenceNumber}
        </Link>
      ),
    },
    {
      key: "createdAt", label: "Date",
      render: (r: any) => <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "intakeChannel", label: "Channel",
      render: (r: any) => <span className="text-xs text-gray-600">{CHANNEL_LABELS[r.intakeChannel] || r.intakeChannel}</span>,
    },
    {
      key: "province", label: "Province",
      render: (r: any) => <span className="text-gray-500">{r.province?.name || "—"}</span>,
    },
    {
      key: "sector", label: "Sector",
      render: (r: any) => <span className="text-gray-500">{r.sector?.name || "—"}</span>,
    },
    {
      key: "severityLevel", label: "Severity",
      render: (r: any) => <span className={severityBadge(r.severityLevel)}>{r.severityLevel}</span>,
    },
    {
      key: "status", label: "Status",
      render: (r: any) => <span className="text-xs text-gray-500">{STATUS_LABELS[r.status] || r.status}</span>,
    },
    {
      key: "actions", label: "Actions", sortable: false,
      render: (r: any) => (
        <div className="flex items-center gap-0.5">
          <Link href={`/dashboard/cases/${r.id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="View">
            <Eye className="w-4 h-4" />
          </Link>
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
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Intake Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review, verify, and classify incoming service delivery reports</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setLoading(true); }}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <DataTable
          data={cases}
          columns={columns}
          searchPlaceholder="Search intake submissions..."
          searchKeys={["referenceNumber", "title", "intakeChannel", "province", "sector"]}
        />
      )}
    </div>
  );
}