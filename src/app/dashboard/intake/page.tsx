"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, Filter, Merge, MessageSquare, X } from "lucide-react";
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

const SECTOR_OPTIONS = [
  "Water Services", "Electricity Supply", "Waste Management", "Roads & Transport",
  "Governance & Financial Distress", "Human Settlements", "Environment", "Other",
];

const PROVINCE_OPTIONS = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

export default function IntakeQueuePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [showClassifyForm, setShowClassifyForm] = useState<string | null>(null);
  const [classifyData, setClassifyData] = useState({ severity: "Moderate", sector: "", province: "" });
  const [classifySubmitting, setClassifySubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("status", activeTab);
    params.set("pageSize", "100");
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((d) => { setCases(d.cases || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const patchCase = async (caseId: string, data: any, actionName: string) => {
    setActionLoading((prev) => ({ ...prev, [caseId]: true }));
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setCases((prev) => prev.map((c) => c.id === caseId ? { ...c, ...data } : c));
        setActionMessage({ type: "success", text: `${actionName} successful` });
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        const err = await res.json();
        setActionMessage({ type: "error", text: err.error || `${actionName} failed` });
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch {
      setActionMessage({ type: "error", text: `${actionName} failed — network error` });
      setTimeout(() => setActionMessage(null), 5000);
    }
    setActionLoading((prev) => ({ ...prev, [caseId]: false }));
  };

  const handleVerify = (caseId: string) => {
    patchCase(caseId, { status: "under_verification", updatedBy: "intake" }, "Verify");
  };

  const handleReject = (caseId: string) => {
    patchCase(caseId, { status: "rejected", updatedBy: "intake" }, "Reject");
  };

  const handleClassify = async (caseId: string) => {
    if (!classifyData.sector || !classifyData.province || !classifyData.severity) return;
    setClassifySubmitting(true);
    try {
      // Map names to IDs — for now we store the name values
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "classified",
          severityLevel: classifyData.severity,
          updatedBy: "intake",
        }),
      });
      if (res.ok) {
        setCases((prev) => prev.map((c) =>
          c.id === caseId ? { ...c, status: "classified", severityLevel: classifyData.severity } : c
        ));
        setShowClassifyForm(null);
        setClassifyData({ severity: "Moderate", sector: "", province: "" });
        setActionMessage({ type: "success", text: "Classification successful" });
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        const err = await res.json();
        setActionMessage({ type: "error", text: err.error || "Classification failed" });
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch {
      setActionMessage({ type: "error", text: "Classification failed — network error" });
      setTimeout(() => setActionMessage(null), 5000);
    }
    setClassifySubmitting(false);
  };

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
        <div className="relative">
          <div className="flex items-center gap-0.5">
            <Link
              href={`/dashboard/cases/${r.id}`}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleVerify(r.id)}
              disabled={actionLoading[r.id]}
              className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-40"
              title="Verify"
            >
              {actionLoading[r.id] ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setShowClassifyForm(r.id);
                setClassifyData({ severity: r.severityLevel || "Moderate", sector: r.sector?.name || "", province: r.province?.name || "" });
              }}
              className="p-1.5 rounded hover:bg-orange-50 text-orange-600 disabled:opacity-40"
              title="Classify"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-purple-50 text-purple-600" title="Merge">
              <Merge className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReject(r.id)}
              disabled={actionLoading[r.id]}
              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-40"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Classify Form */}
          {showClassifyForm === r.id && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">Classify Case</p>
                <button onClick={() => setShowClassifyForm(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Severity</label>
                  <select
                    value={classifyData.severity}
                    onChange={(e) => setClassifyData({ ...classifyData, severity: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Stable">Stable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Sector</label>
                  <select
                    value={classifyData.sector}
                    onChange={(e) => setClassifyData({ ...classifyData, sector: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select sector</option>
                    {SECTOR_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Province</label>
                  <select
                    value={classifyData.province}
                    onChange={(e) => setClassifyData({ ...classifyData, province: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select province</option>
                    {PROVINCE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleClassify(r.id)}
                  disabled={classifySubmitting || !classifyData.sector || !classifyData.province}
                  className="w-full py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {classifySubmitting ? "Classifying..." : "Apply Classification"}
                </button>
              </div>
            </div>
          )}
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

      {/* Action Message Toast */}
      {actionMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
          actionMessage.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {actionMessage.text}
        </div>
      )}

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
