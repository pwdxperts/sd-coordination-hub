"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Clock, Calendar, MapPin, Building2,
  User, FileText, Activity, CheckCircle, XCircle, ChevronDown,
  MessageSquare, Paperclip, Shield, AlertCircle, UserPlus, Save, X,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "action_plan", label: "Action Plan", icon: Activity },
  { id: "evidence", label: "Evidence", icon: Paperclip },
  { id: "escalations", label: "Escalations", icon: AlertTriangle },
  { id: "audit", label: "Audit Log", icon: Shield },
];

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Stable: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  new_submission: "bg-blue-50 text-blue-700",
  under_verification: "bg-indigo-50 text-indigo-700",
  duplicate: "bg-purple-50 text-purple-700",
  classified: "bg-cyan-50 text-cyan-700",
  assigned: "bg-teal-50 text-teal-700",
  action_plan: "bg-amber-50 text-amber-700",
  intervention: "bg-orange-50 text-orange-700",
  monitoring: "bg-sky-50 text-sky-700",
  escalated: "bg-red-50 text-red-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-50 text-gray-700",
  reopened: "bg-rose-50 text-rose-700",
};

const STATUS_LABELS: Record<string, string> = {
  new_submission: "New Submission", under_verification: "Under Verification",
  duplicate: "Duplicate", classified: "Classified", assigned: "Assigned",
  action_plan: "Action Plan", intervention: "Intervention", monitoring: "Monitoring",
  escalated: "Escalated", resolved: "Resolved", closed: "Closed", reopened: "Reopened",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new_submission: ["under_verification"],
  under_verification: ["classified", "duplicate"],
  classified: ["assigned"],
  assigned: ["action_plan", "escalated"],
  action_plan: ["intervention", "escalated"],
  intervention: ["monitoring", "escalated"],
  monitoring: ["resolved", "escalated"],
  escalated: ["intervention", "resolved"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["action_plan", "intervention"],
};

const ACTION_LABELS: Record<string, string> = {
  under_verification: "Send to Verification",
  duplicate: "Mark Duplicate",
  classified: "Classify",
  assigned: "Assign",
  action_plan: "Request Action Plan",
  intervention: "Start Intervention",
  monitoring: "Begin Monitoring",
  escalated: "Escalate Case",
  resolved: "Mark Resolved",
  closed: "Close Case",
  reopened: "Reopen",
};

const MILESTONE_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-600",
  overdue: "bg-red-100 text-red-600",
  blocked: "bg-orange-100 text-orange-600",
};

export default function CaseDetailPage() {
  const params = useParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionStatus, setActionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");

  const fetchCase = () => {
    setLoading(true);
    fetch(`/api/cases/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCaseData(data);
        setSelectedAssigneeId(data?.assignedToId || data?.assignedTo?.id || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCase();
  }, [params.id]);

  const refreshCase = async () => {
    const response = await fetch(`/api/cases/${params.id}`);
    if (!response.ok) throw new Error("Could not refresh case details");
    const data = await response.json();
    setCaseData(data);
    setSelectedAssigneeId(data?.assignedToId || data?.assignedTo?.id || "");
  };

  const loadAssignableUsers = async () => {
    setAssignmentLoading(true);
    try {
      const response = await fetch(`/api/users/assignable?caseId=${params.id}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not load assignable users");
      }
      const data = await response.json();
      setAssignableUsers(data.users || []);
    } catch (error) {
      setActionStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not load assignable users.",
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const openAssignment = async () => {
    setActionStatus(null);
    setAssignmentOpen(true);
    setSelectedAssigneeId(caseData?.assignedToId || caseData?.assignedTo?.id || "");
    setAssignmentNote("");
    await loadAssignableUsers();
  };

  const submitAssignment = async () => {
    if (!selectedAssigneeId) {
      setActionStatus({ type: "error", message: "Select the person responsible for this case." });
      return;
    }

    setSavingStatus("assigned");
    setActionStatus(null);
    const canMoveToAssigned = (STATUS_TRANSITIONS[caseData.status] || []).includes("assigned");
    const payload: Record<string, string> = { assignedToId: selectedAssigneeId };
    if (canMoveToAssigned) payload.status = "assigned";
    if (assignmentNote.trim()) payload.actionPlan = assignmentNote.trim();

    try {
      const response = await fetch(`/api/cases/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign case");
      }

      await refreshCase();
      setAssignmentOpen(false);
      setActionStatus({ type: "success", message: "Case assigned to an individual and workflow updated." });
    } catch (error) {
      setActionStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSavingStatus(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    setActionStatus(null);

    if (status === "assigned") {
      await openAssignment();
      return;
    }

    setSavingStatus(status);

    try {
      if (status === "escalated") {
        const response = await fetch(`/api/cases/${params.id}/escalate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Manual escalation from case detail workflow",
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to escalate case");
        }

        await refreshCase();
        setActiveTab("escalations");
        setActionStatus({ type: "success", message: "Case escalated and escalation history updated." });
        return;
      }

      const response = await fetch(`/api/cases/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update case status");
      }

      await refreshCase();
      setActionStatus({ type: "success", message: `Case moved to ${STATUS_LABELS[status] || status}.` });
    } catch (error) {
      setActionStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSavingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-500 font-medium">Case not found</h3>
        <Link href="/dashboard/cases" className="text-blue-600 text-sm mt-2 inline-block">Back to Cases</Link>
      </div>
    );
  }

  const severityScore = caseData.severityScore || 0;
  const gaugeRotation = (severityScore / 100) * 180;
  const nextActions = STATUS_TRANSITIONS[caseData.status] || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/cases" className="hover:text-blue-600">Cases</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{caseData.referenceNumber}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{caseData.referenceNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[caseData.severityLevel] || ""}`}>
              {caseData.severityLevel}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[caseData.status] || ""}`}>
              {STATUS_LABELS[caseData.status] || caseData.status}
            </span>
            {caseData.assignedTo && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <User className="w-3 h-3" />
                {caseData.assignedTo.name}
              </span>
            )}
            {caseData.escalationLevel && caseData.escalationLevel !== "none" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                {caseData.escalationLevel}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{caseData.title}</h1>
        </div>

        {/* Status Transition Buttons */}
        <div className="flex flex-col items-start sm:items-end gap-2 no-print">
          <p className="text-xs font-medium text-gray-500">Next workflow actions</p>
          <div className="flex flex-wrap justify-start sm:justify-end gap-2">
            {nextActions.length > 0 ? (
              nextActions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={savingStatus !== null}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    status === "escalated"
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {savingStatus === status ? "Updating..." : ACTION_LABELS[status] || STATUS_LABELS[status] || status}
                </button>
              ))
            ) : (
              <span className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
                No further action
              </span>
            )}
          </div>
        </div>
      </div>

      {actionStatus && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          actionStatus.type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {actionStatus.message}
        </div>
      )}

      {assignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Assign Individual</h3>
                <p className="text-xs text-gray-500">Only eligible users for this province are shown.</p>
              </div>
              <button onClick={() => setAssignmentOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Responsible person</span>
                <select
                  value={selectedAssigneeId}
                  onChange={(event) => setSelectedAssigneeId(event.target.value)}
                  disabled={assignmentLoading}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                >
                  <option value="">{assignmentLoading ? "Loading users..." : "Select a person"}</option>
                  {assignableUsers.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} - {person.role.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Assignment note</span>
                <textarea
                  value={assignmentNote}
                  onChange={(event) => setAssignmentNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Optional instruction for the assigned person"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                onClick={() => setAssignmentOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAssignment}
                disabled={savingStatus === "assigned" || assignmentLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingStatus === "assigned" ? "Assigning..." : "Assign Case"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Severity Score Gauge */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Severity Score</p>
            <div className="relative w-24 h-14 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-red-100 via-amber-100 to-green-100 rounded-t-full" />
              <div
                className="absolute top-1 left-1/2 w-1 h-7 bg-gray-800 rounded-full origin-bottom transition-transform"
                style={{ transform: `translateX(-50%) rotate(${gaugeRotation - 90}deg)` }}
              />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
                <p className="text-xl font-bold text-gray-900">{severityScore}</p>
                <p className="text-[10px] text-gray-500">/ 100</p>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Population Affected</p>
              <p className="font-semibold text-gray-900">{caseData.populationAffected?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Duration (Days)</p>
              <p className="font-semibold text-gray-900">{caseData.durationDays || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Public Safety Risk</p>
              <p className={`font-semibold ${caseData.publicSafetyRisk ? "text-red-600" : "text-green-600"}`}>
                {caseData.publicSafetyRisk ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Recurring</p>
              <p className={`font-semibold ${caseData.isRecurring ? "text-amber-600" : "text-gray-600"}`}>
                {caseData.isRecurring ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Incident Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Description</dt>
                <dd className="text-gray-900 max-w-[60%] text-right">{caseData.description || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Received</dt>
                <dd className="text-gray-900">{new Date(caseData.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Channel</dt>
                <dd className="text-gray-900 capitalize">{caseData.intakeChannel}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Reporter</dt>
                <dd className="text-gray-900">{caseData.reporterName || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Contact</dt>
                <dd className="text-gray-900">{caseData.reporterContact || "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Location & Classification</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Province</dt>
                <dd className="text-gray-900">{caseData.province?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">District</dt>
                <dd className="text-gray-900">{caseData.district?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Municipality</dt>
                <dd className="text-gray-900">{caseData.municipality?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Ward</dt>
                <dd className="text-gray-900">{caseData.ward || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Sector</dt>
                <dd className="text-gray-900">{caseData.sector?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{caseData.failureCategory?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Root Cause</dt>
                <dd className="text-gray-900">{caseData.rootCause || "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Assignment</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Responsible</dt>
                <dd className="text-gray-900">{caseData.responsibleSphere || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Lead Dept</dt>
                <dd className="text-gray-900">{caseData.leadDepartment?.name || "-"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Assigned To</dt>
                <dd className="text-gray-900">{caseData.assignedTo?.name || "Unassigned"}</dd>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={openAssignment}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign Individual
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Accountable</dt>
                <dd className="text-gray-900">{caseData.accountableOfficial || "-"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h3>
          <div className="relative">
            {caseData.auditLogs?.length > 0 ? (
              <div className="space-y-0">
                {caseData.auditLogs.map((log: any, i: number) => (
                  <div key={log.id} className="flex gap-4 pb-4 relative">
                    {i < caseData.auditLogs.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.action.startsWith("CASE_CREATED") ? "bg-green-100" :
                      log.action === "ESCALATED" ? "bg-red-100" :
                      "bg-blue-100"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        log.action.startsWith("CASE_CREATED") ? "bg-green-500" :
                        log.action === "ESCALATED" ? "bg-red-500" :
                        "bg-blue-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, " ")}</p>
                        <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{log.comment || "-"}</p>
                      {log.user && <p className="text-xs text-gray-400 mt-0.5">by {log.user.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No timeline entries</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "action_plan" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Action Plan</h3>
            {caseData.progressPercent !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Progress</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${caseData.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{caseData.progressPercent}%</span>
              </div>
            )}
          </div>

          {caseData.actionPlan && (
            <p className="text-sm text-gray-600 mb-4">{caseData.actionPlan}</p>
          )}

          {caseData.blockers && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-orange-700">Blockers</p>
              <p className="text-sm text-orange-600">{caseData.blockers}</p>
            </div>
          )}

          {/* Milestones */}
          <h4 className="text-sm font-medium text-gray-700 mb-3">Milestones</h4>
          {caseData.milestones?.length > 0 ? (
            <div className="space-y-2">
              {caseData.milestones.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.status === "completed" ? "bg-green-100" :
                    m.status === "in_progress" ? "bg-blue-100" :
                    m.status === "overdue" ? "bg-red-100" :
                    "bg-gray-100"
                  }`}>
                    {m.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : m.status === "in_progress" ? (
                      <Activity className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{m.title}</p>
                    {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                    {m.assignedTo && <p className="text-xs text-gray-400 mt-0.5">Assigned to {m.assignedTo}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    MILESTONE_COLORS[m.status] || "bg-gray-100 text-gray-600"
                  }`}>
                    {m.status.replace(/_/g, " ")}
                  </span>
                  {m.dueDate && (
                    <span className="text-xs text-gray-400">{new Date(m.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No milestones defined</p>
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Evidence Files</h3>
          {caseData.evidence?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caseData.evidence.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.fileName}</p>
                    {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No evidence uploaded</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "escalations" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Escalation History</h3>
          {caseData.escalations?.length > 0 ? (
            <div className="space-y-3">
              {caseData.escalations.map((esc: any) => (
                <div key={esc.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    esc.level === "L5" || esc.level === "L4" ? "bg-red-100" :
                    esc.level === "L3" ? "bg-orange-100" :
                    "bg-amber-100"
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      esc.level === "L5" || esc.level === "L4" ? "text-red-600" :
                      esc.level === "L3" ? "text-orange-600" :
                      "text-amber-600"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{esc.level}</span>
                      <span className="text-xs text-gray-500">→ {esc.escalatedTo}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                        esc.status === "active" ? "bg-red-50 text-red-700" :
                        esc.status === "responded" ? "bg-amber-50 text-amber-700" :
                        "bg-green-50 text-green-700"
                      }`}>
                        {esc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{esc.reason}</p>
                    {esc.response && (
                      <div className="mt-2 bg-white rounded p-2 border border-gray-100">
                        <p className="text-xs text-gray-500">Response:</p>
                        <p className="text-sm text-gray-700">{esc.response}</p>
                      </div>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>Escalated: {new Date(esc.escalatedAt).toLocaleString()}</span>
                      {esc.respondedAt && <span>Responded: {new Date(esc.respondedAt).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No escalations recorded</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Full Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-3">Date/Time</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Comment</th>
                </tr>
              </thead>
              <tbody>
                {caseData.auditLogs?.map((log: any) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-3 text-xs text-gray-600">{log.user?.name || "System"}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500 max-w-[300px] truncate">{log.comment || "-"}</td>
                  </tr>
                ))}
                {(!caseData.auditLogs || caseData.auditLogs.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No audit entries</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
