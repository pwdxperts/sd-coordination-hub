"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye, CheckCircle, XCircle, Filter, Merge, MessageSquare, X,
  Search, RefreshCw, Download, RotateCcw, AlertTriangle,
  GitMerge, ChevronDown, Plus, Inbox, Upload, FileSpreadsheet, ChevronRight, CheckCircle2, Circle as CircleIcon,
} from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", email: "Email", manual: "Manual Entry",
  municipal_report: "Municipal Report", public: "Public Portal", social_media: "Social Media",
};

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New", under_verification: "Verifying", duplicate: "Duplicate",
  rejected: "Rejected", classified: "Classified", assigned: "Assigned",
  action_plan: "Action Plan", intervention: "Intervention", monitoring: "Monitoring", resolved: "Resolved",
};

const STATUS_COLORS: Record<string, string> = {
  new_submission: "bg-blue-50 text-blue-700 border-blue-200",
  under_verification: "bg-amber-50 text-amber-700 border-amber-200",
  duplicate: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  classified: "bg-orange-50 text-orange-700 border-orange-200",
  assigned: "bg-teal-50 text-teal-700 border-teal-200",
};

const SEV_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-green-50 text-green-700 border-green-200",
};

const TABS = [
  { id: "all", label: "All" },
  { id: "new_submission", label: "New" },
  { id: "under_verification", label: "Verifying" },
  { id: "duplicate", label: "Duplicates" },
  { id: "rejected", label: "Rejected" },
  { id: "classified", label: "Classified" },
];

const REJECT_REASONS = [
  "Insufficient information provided",
  "Duplicate submission",
  "Outside our mandate / jurisdiction",
  "Invalid or fraudulent submission",
  "Already being addressed",
  "Other",
];

const SECTOR_OPTIONS = [
  "Water Services", "Electricity Supply", "Waste Management", "Roads & Transport",
  "Governance & Financial Distress", "Human Settlements", "Environment",
  "Health Services", "Multi-Service", "Infrastructure", "Education", "Other",
];

const PROVINCE_OPTIONS = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

export default function IntakeQueuePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [reinstateModal, setReinstateModal] = useState<any>(null);
  const [reinstateNote, setReinstateNote] = useState("");
  const [reinstateSubmitting, setReinstateSubmitting] = useState(false);

  const [mergeModal, setMergeModal] = useState<any>(null);
  const [mergeTarget, setMergeTarget] = useState<any>(null);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  const [classifyModal, setClassifyModal] = useState<any>(null);
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importParsing, setImportParsing] = useState(false);
  const [importRunning, setImportRunning] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [classifyData, setClassifyData] = useState({ severity: "Moderate", sector: "", province: "" });
  const [classifySubmitting, setClassifySubmitting] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCases = () => {
    setLoading(true);
    fetch(`/api/cases?pageSize=200`)
      .then(r => r.ok ? r.json() : { cases: [] })
      .then(d => { setAllCases(d.cases || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadCases(); }, []);

  // Apply all filters client-side
  const filtered = allCases.filter(c => {
    if (activeTab !== "all" && c.status !== activeTab) return false;
    if (filterProvince && c.province?.name !== filterProvince) return false;
    if (filterSeverity && c.severityLevel !== filterSeverity) return false;
    if (filterSector && c.sector?.name !== filterSector) return false;
    if (filterDateFrom && new Date(c.createdAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(c.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.referenceNumber?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.province?.name?.toLowerCase().includes(q) ||
        c.sector?.name?.toLowerCase().includes(q) ||
        c.reporterName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.id] = t.id === "all" ? allCases.length : allCases.filter(c => c.status === t.id).length;
    return acc;
  }, {} as Record<string, number>);

  const hasFilters = filterProvince || filterSeverity || filterSector || filterDateFrom || filterDateTo || search;
  const clearFilters = () => {
    setSearch(""); setFilterProvince(""); setFilterSeverity(""); setFilterSector(""); setFilterDateFrom(""); setFilterDateTo("");
  };

  const patchCase = async (caseId: string, data: any) => {
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    return res;
  };

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerify = async (c: any) => {
    setActionLoading(p => ({ ...p, [c.id]: true }));
    const res = await patchCase(c.id, { status: "under_verification" });
    if (res.ok) {
      setAllCases(p => p.map(x => x.id === c.id ? { ...x, status: "under_verification" } : x));
      showToast("success", `${c.referenceNumber} moved to Verification`);
    } else showToast("error", "Action failed");
    setActionLoading(p => ({ ...p, [c.id]: false }));
  };

  // ── Reject (with note) ────────────────────────────────────────────────────
  const openRejectModal = (c: any) => {
    setRejectModal(c); setRejectReason(REJECT_REASONS[0]); setRejectNote("");
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    setRejectSubmitting(true);
    const fullNote = `Rejected: ${rejectReason}${rejectNote ? ` — ${rejectNote}` : ""}`;
    const res = await patchCase(rejectModal.id, { status: "rejected", resolutionNotes: fullNote });
    if (res.ok) {
      setAllCases(p => p.map(x => x.id === rejectModal.id ? { ...x, status: "rejected", resolutionNotes: fullNote } : x));
      showToast("success", `${rejectModal.referenceNumber} rejected`);
      setRejectModal(null);
    } else showToast("error", "Rejection failed");
    setRejectSubmitting(false);
  };

  // ── Reinstate / Appeal ────────────────────────────────────────────────────
  const openReinstateModal = (c: any) => {
    setReinstateModal(c); setReinstateNote("");
  };

  const handleReinstate = async () => {
    if (!reinstateModal) return;
    setReinstateSubmitting(true);
    const note = reinstateNote || "Reinstated by administrator";
    const res = await patchCase(reinstateModal.id, {
      status: "new_submission",
      resolutionNotes: `REINSTATED: ${note}`,
    });
    if (res.ok) {
      setAllCases(p => p.map(x => x.id === reinstateModal.id ? { ...x, status: "new_submission", resolutionNotes: `REINSTATED: ${note}` } : x));
      showToast("success", `${reinstateModal.referenceNumber} reinstated to queue`);
      setReinstateModal(null);
    } else showToast("error", "Reinstatement failed");
    setReinstateSubmitting(false);
  };

  // ── Merge ─────────────────────────────────────────────────────────────────
  const openMergeModal = (c: any) => {
    setMergeModal(c); setMergeTarget(null); setMergeSearch("");
  };

  const mergeResults = mergeSearch.length > 1
    ? allCases.filter(c =>
        c.id !== mergeModal?.id &&
        c.status !== "duplicate" &&
        (c.referenceNumber?.toLowerCase().includes(mergeSearch.toLowerCase()) ||
         c.title?.toLowerCase().includes(mergeSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleMerge = async () => {
    if (!mergeModal || !mergeTarget) return;
    setMergeSubmitting(true);
    // Mark the current case as duplicate of the target
    const res = await patchCase(mergeModal.id, {
      status: "duplicate",
      linkedCaseId: mergeTarget.id,
      duplicatedFromId: mergeTarget.id,
      isDuplicate: true,
      resolutionNotes: `Merged into ${mergeTarget.referenceNumber} — duplicate case`,
    });
    if (res.ok) {
      setAllCases(p => p.map(x => x.id === mergeModal.id ? { ...x, status: "duplicate" } : x));
      showToast("success", `${mergeModal.referenceNumber} merged into ${mergeTarget.referenceNumber}`);
      setMergeModal(null);
    } else showToast("error", "Merge failed");
    setMergeSubmitting(false);
  };

  // ── Classify ─────────────────────────────────────────────────────────────
  const openClassifyModal = (c: any) => {
    setClassifyModal(c);
    setClassifyData({ severity: c.severityLevel || "Moderate", sector: c.sector?.name || "", province: c.province?.name || "" });
  };

  const handleClassify = async () => {
    if (!classifyModal || !classifyData.sector || !classifyData.province) return;
    setClassifySubmitting(true);
    const res = await patchCase(classifyModal.id, {
      status: "classified",
      severityLevel: classifyData.severity,
    });
    if (res.ok) {
      setAllCases(p => p.map(x => x.id === classifyModal.id ? { ...x, status: "classified", severityLevel: classifyData.severity } : x));
      showToast("success", `${classifyModal.referenceNumber} classified`);
      setClassifyModal(null);
    } else showToast("error", "Classification failed");
    setClassifySubmitting(false);
  };

  const parseImportFile = async (file: File) => {
    setImportParsing(true);
    setImportRows([]);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "csv") {
        const text = await file.text();
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.replace(/["\']/g,"").trim());
        const rows = lines.slice(1).map(line => {
          // Handle quoted CSV values
          const vals: string[] = [];
          let cur = "", inQ = false;
          for (const ch of line) {
            if (ch === "\"") inQ = !inQ;
            else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
            else cur += ch;
          }
          vals.push(cur.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i] || "");
          return obj;
        }).filter(r => Object.values(r).some(v => v));
        setImportRows(rows);
      } else {
        // Excel: use SheetJS via dynamic import
        const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs" as any);
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setImportRows(rows as any[]);
      }
    } catch (e: any) {
      showToast("error", `Parse error: ${e.message}`);
    }
    setImportParsing(false);
  };

  const runImport = async () => {
    if (!importRows.length) return;
    setImportRunning(true);
    const BATCH = 50;
    let totalCreated = 0, totalSkipped = 0, totalErrors = 0;
    const allResults: any[] = [];
    for (let i = 0; i < importRows.length; i += BATCH) {
      const batch = importRows.slice(i, i + BATCH);
      const res = await fetch("/api/cases/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: batch }),
      });
      const d: any = await res.json();
      if (d.summary) {
        totalCreated += d.summary.created;
        totalSkipped += d.summary.skipped;
        totalErrors += d.summary.errors;
        allResults.push(...(d.results || []));
      }
    }
    const result = { file: importFile?.name, date: new Date().toLocaleString("en-ZA"), total: importRows.length, created: totalCreated, skipped: totalSkipped, errors: totalErrors, results: allResults };
    setImportResult(result);
    setImportHistory(prev => [result, ...prev].slice(0, 10));
    setImportRunning(false);
    if (totalCreated > 0) loadCases();
  };

  const exportCSV = () => {
    const headers = ["Reference", "Title", "Status", "Severity", "Province", "Sector", "Channel", "Date"];
    const rows = filtered.map(c => [
      c.referenceNumber, `"${(c.title || "").replace(/"/g,'""')}"`, c.status,
      c.severityLevel, c.province?.name || "", c.sector?.name || "",
      c.intakeChannel, new Date(c.createdAt).toLocaleDateString("en-ZA"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `intake-queue-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, verify, classify, and action incoming service delivery reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadCases} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => { setImportModal(true); setImportFile(null); setImportRows([]); setImportResult(null); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
            <Upload className="w-3.5 h-3.5" /> Import Excel / CSV
          </button>
          <Link href="/dashboard/cases/new" className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Log Case
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`bg-white border rounded-xl p-3 text-left transition-all hover:shadow-sm ${activeTab === tab.id ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"}`}>
            <p className="text-xs text-gray-500 mb-1">{tab.label}</p>
            <p className={`text-xl font-bold ${activeTab === tab.id ? "text-blue-700" : "text-gray-900"}`}>
              {tabCounts[tab.id] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Reference, title, province..." 
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
          </div>

          {/* Province */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Province</label>
            <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">All Provinces</option>
              {PROVINCE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Severity */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Severity</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">All Levels</option>
              {["Critical","High","Moderate","Stable"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sector */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Sector</label>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">All Sectors</option>
              {SECTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="px-2.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 self-end">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        {hasFilters && (
          <p className="text-xs text-blue-600 mt-2">Showing {filtered.length} of {allCases.length} cases</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No cases match your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/cases/${c.id}`} className="text-blue-600 hover:underline font-mono text-xs font-medium">{c.referenceNumber}</Link>
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-sm text-gray-800 truncate">{c.title}</p>
                      {c.status === "rejected" && c.resolutionNotes && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{c.resolutionNotes}</p>
                      )}
                      {c.status === "duplicate" && (
                        <p className="text-xs text-purple-500 mt-0.5">Merged as duplicate</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{c.province?.name || "—"}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{c.sector?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${SEV_COLORS[c.severityLevel] || "bg-gray-50 text-gray-500"}`}>
                        {c.severityLevel || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[c.status] || "bg-gray-50 text-gray-500"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{CHANNEL_LABELS[c.intakeChannel] || c.intakeChannel || "—"}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("en-ZA")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5">
                        <Link href={`/dashboard/cases/${c.id}`} title="View"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Rejected cases get reinstate button */}
                        {c.status === "rejected" ? (
                          <button onClick={() => openReinstateModal(c)} title="Reinstate / Appeal"
                            className="p-1.5 rounded hover:bg-green-50 text-green-600">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : c.status !== "duplicate" && (
                          <>
                            {c.status === "new_submission" && (
                              <button onClick={() => handleVerify(c)} disabled={actionLoading[c.id]} title="Verify"
                                className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-40">
                                {actionLoading[c.id]
                                  ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                  : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {(c.status === "new_submission" || c.status === "under_verification") && (
                              <button onClick={() => openClassifyModal(c)} title="Classify"
                                className="p-1.5 rounded hover:bg-orange-50 text-orange-600">
                                <Filter className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openMergeModal(c)} title="Merge with another case"
                              className="p-1.5 rounded hover:bg-purple-50 text-purple-600">
                              <GitMerge className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openRejectModal(c)} title="Reject"
                              className="p-1.5 rounded hover:bg-red-50 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            {filtered.length} case{filtered.length !== 1 ? "s" : ""} displayed
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ─────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Reject Case</p>
                <h3 className="text-base font-semibold text-gray-900">{rejectModal.referenceNumber}</h3>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-800">
                Rejecting this case will move it to the <strong>Rejected</strong> tab. The submitter can appeal and the case can be reinstated by any admin or analyst.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
                  {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Additional Note <span className="text-gray-400">(optional)</span></label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3}
                  placeholder="Provide any additional context or instructions for appeal..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">After Rejection:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Case moves to Rejected tab with your reason visible</li>
                  <li>Submitter can submit an appeal with new evidence</li>
                  <li>Any admin or analyst can reinstate using the ↩ button</li>
                  <li>Reinstatement moves case back to New with a note</li>
                </ol>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleReject} disabled={rejectSubmitting || !rejectReason}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REINSTATE MODAL ───────────────────────────────────────────────── */}
      {reinstateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReinstateModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Reinstate Case / Appeal</p>
                <h3 className="text-base font-semibold text-gray-900">{reinstateModal.referenceNumber}</h3>
              </div>
              <button onClick={() => setReinstateModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {reinstateModal.resolutionNotes && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Previous Rejection Reason</p>
                  <p className="text-sm text-red-800">{reinstateModal.resolutionNotes}</p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-800">
                Reinstating will move this case back to <strong>New Submission</strong> for re-processing. A note will be added to the audit log.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Reinstatement <span className="text-red-500">*</span></label>
                <textarea value={reinstateNote} onChange={e => setReinstateNote(e.target.value)} rows={3}
                  placeholder="Why is this case being reinstated? What new information or appeal basis exists?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setReinstateModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleReinstate} disabled={reinstateSubmitting || !reinstateNote.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                <RotateCcw className="w-3.5 h-3.5" />
                {reinstateSubmitting ? "Reinstating..." : "Reinstate Case"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MERGE MODAL ───────────────────────────────────────────────────── */}
      {mergeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setMergeModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Merge Case</p>
                <h3 className="text-base font-semibold text-gray-900">{mergeModal.referenceNumber} — duplicate of...</h3>
              </div>
              <button onClick={() => setMergeModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-xs text-purple-800">
                This case (<strong>{mergeModal.referenceNumber}</strong>) will be marked as a <strong>duplicate</strong> and merged into the primary case you select below. The primary case remains active.
              </div>

              {/* Source case */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-1">This case (will become duplicate)</p>
                <p className="text-sm font-semibold text-gray-900">{mergeModal.referenceNumber}</p>
                <p className="text-xs text-gray-500 truncate">{mergeModal.title}</p>
              </div>

              {/* Search for primary */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search for primary case <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={mergeSearch} onChange={e => setMergeSearch(e.target.value)}
                    placeholder="Type reference number or title..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>
                {mergeResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                    {mergeResults.map((r: any) => (
                      <button key={r.id} onClick={() => { setMergeTarget(r); setMergeSearch(r.referenceNumber); }}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 hover:bg-purple-50 flex items-center justify-between ${mergeTarget?.id === r.id ? "bg-purple-50" : ""}`}>
                        <div>
                          <span className="font-mono text-xs font-medium text-purple-700">{r.referenceNumber}</span>
                          <span className="text-gray-600 ml-2 truncate">{r.title?.substring(0, 50)}</span>
                        </div>
                        {mergeTarget?.id === r.id && <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {mergeTarget && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs font-medium text-purple-700 mb-1">Primary case (remains active)</p>
                  <p className="text-sm font-semibold text-gray-900">{mergeTarget.referenceNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{mergeTarget.title}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setMergeModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleMerge} disabled={mergeSubmitting || !mergeTarget}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                <GitMerge className="w-3.5 h-3.5" />
                {mergeSubmitting ? "Merging..." : "Confirm Merge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT MODAL ──────────────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !importRunning && setImportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Bulk Import</p>
                <h3 className="text-base font-semibold text-gray-900">Import Cases from Excel or CSV</h3>
              </div>
              {!importRunning && <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* File format guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Accepted File Formats</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-blue-800">
                  <div><p className="font-medium mb-1">Excel (.xlsx / .xls)</p><p>Each row = one case. Headers in row 1.</p></div>
                  <div><p className="font-medium mb-1">CSV (.csv)</p><p>Comma-separated. First row = column headers.</p></div>
                </div>
                <p className="text-xs text-blue-700 mt-2 font-medium">Recognised column headers (case-insensitive):</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["title","province","district","municipality","ward","sector","severity","channel","reporter","contact","description","reference"].map(h=>(
                    <span key={h} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono text-[10px]">{h}</span>
                  ))}
                </div>
              </div>

              {/* File picker */}
              {!importResult ? (
                <>
                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${importFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}>
                    <FileSpreadsheet className={`w-10 h-10 ${importFile ? "text-green-500" : "text-gray-300"}`} />
                    {importFile ? (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-green-800">{importFile.name}</p>
                        <p className="text-xs text-green-600">{(importFile.size/1024).toFixed(1)} KB — {importParsing ? "Parsing..." : `${importRows.length} rows detected`}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Drop your Excel or CSV file here</p>
                        <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv"
                      onChange={e => { const f=e.target.files?.[0]; if(f){setImportFile(f); parseImportFile(f);}}} />
                  </label>

                  {/* Preview */}
                  {importRows.length > 0 && !importParsing && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Preview — First 5 Rows ({importRows.length} total)</p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {Object.keys(importRows[0]).slice(0,7).map(k=>(
                                <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.slice(0,5).map((row,i)=>(
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                {Object.values(row).slice(0,7).map((val,j)=>(
                                  <td key={j} className="px-3 py-1.5 text-gray-700 truncate max-w-[120px]">{String(val||"")}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Import button */}
                  {importRows.length > 0 && (
                    <button onClick={runImport} disabled={importRunning || importParsing}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                      {importRunning ? <><RefreshCw className="w-4 h-4 animate-spin" />Importing {importRows.length} rows...</>
                        : <><Upload className="w-4 h-4" />Import {importRows.length} Cases</>}
                    </button>
                  )}
                </>
              ) : (
                /* Results */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{importResult.created}</p>
                      <p className="text-xs text-green-600 mt-0.5">Cases Created</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                      <p className="text-xs text-amber-600 mt-0.5">Skipped (Duplicates)</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{importResult.errors}</p>
                      <p className="text-xs text-red-600 mt-0.5">Errors</p>
                    </div>
                  </div>

                  {/* Row-level results */}
                  {importResult.results?.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr><th className="px-3 py-2 text-left text-gray-500">Row</th><th className="px-3 py-2 text-left text-gray-500">Status</th><th className="px-3 py-2 text-left text-gray-500">Reference</th><th className="px-3 py-2 text-left text-gray-500">Reason</th></tr>
                        </thead>
                        <tbody>
                          {importResult.results.map((r: any, i: number) => (
                            <tr key={i} className={`border-b border-gray-50 ${r.status==="created"?"bg-green-50/50":r.status==="error"?"bg-red-50/50":"bg-amber-50/50"}`}>
                              <td className="px-3 py-1.5 text-gray-500">{r.row}</td>
                              <td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status==="created"?"bg-green-100 text-green-700":r.status==="error"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                              <td className="px-3 py-1.5 font-mono text-gray-700">{r.ref||"—"}</td>
                              <td className="px-3 py-1.5 text-gray-500 truncate max-w-[200px]">{r.reason||""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setImportFile(null); setImportRows([]); setImportResult(null); }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Import Another File</button>
                    <button onClick={() => setImportModal(false)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Done</button>
                  </div>
                </div>
              )}

              {/* Import History */}
              {importHistory.length > 0 && !importResult && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Import History (This Session)</p>
                  <div className="space-y-1.5">
                    {importHistory.map((h: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium text-gray-700">{h.file}</p>
                          <p className="text-gray-400">{h.date}</p>
                        </div>
                        <div className="flex gap-2 text-right">
                          <span className="text-green-600 font-medium">{h.created} created</span>
                          <span className="text-amber-500">{h.skipped} skipped</span>
                          {h.errors>0 && <span className="text-red-500">{h.errors} errors</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CLASSIFY MODAL ────────────────────────────────────────────────── */}
      {classifyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setClassifyModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Classify Case</p>
                <h3 className="text-base font-semibold text-gray-900">{classifyModal.referenceNumber}</h3>
              </div>
              <button onClick={() => setClassifyModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Severity Level</label>
                <select value={classifyData.severity} onChange={e => setClassifyData(p => ({ ...p, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  {["Critical","High","Moderate","Stable"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sector <span className="text-red-500">*</span></label>
                <select value={classifyData.sector} onChange={e => setClassifyData(p => ({ ...p, sector: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="">Select sector</option>
                  {SECTOR_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Province <span className="text-red-500">*</span></label>
                <select value={classifyData.province} onChange={e => setClassifyData(p => ({ ...p, province: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20">
                  <option value="">Select province</option>
                  {PROVINCE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setClassifyModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleClassify} disabled={classifySubmitting || !classifyData.sector || !classifyData.province}
                className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {classifySubmitting ? "Classifying..." : "Apply Classification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
