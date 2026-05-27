"use client";
import VerificationChecklist from "@/components/case-tabs/VerificationChecklist";
mport { useState, useEffect } from "react";
import { Save, ArrowRight, CheckCircle } from "lucide-react";

const NEXT_STATUS: Record<string,string> = {
  new_submission: "under_verification",
  under_verification: "classified",
  classified: "assigned",
  assigned: "action_plan",
  action_plan: "intervention",
  intervention: "monitoring",
  monitoring: "resolved",
};

const NEXT_LABELS: Record<string,string> = {
  new_submission:     "✓ Mark as Verified",
  under_verification: "✓ Classify Case",
  classified:         "Assign to Person",
  assigned:           "✓ Submit Action Plan",
  action_plan:        "✓ Begin Intervention",
  intervention:       "✓ Mark Intervention Complete",
  monitoring:         "✓ Mark Resolved",
};

export default function ActionPlanTab({ caseId, caseStatus, currentUser, caseData, onStatusChange }: any) {
  const [form, setForm] = useState({ actionPlan: "", actionPlanDueDate: "", progressPercent: 0, blockers: "", interventionPlan: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/cases/${caseId}/action-plan`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.actionPlan) {
          setForm({
            actionPlan: d.actionPlan.actionPlan || "",
            actionPlanDueDate: d.actionPlan.actionPlanDueDate ? new Date(d.actionPlan.actionPlanDueDate).toISOString().split("T")[0] : "",
            progressPercent: d.actionPlan.progressPercent || 0,
            blockers: d.actionPlan.blockers || "",
            interventionPlan: d.actionPlan.interventionPlan || "",
          });
        }
        setLoading(false);
      });
  }, [caseId]);

  const save = async (advanceStatus?: boolean) => {
    setSaving(true);
    const body: any = { ...form };
    if (advanceStatus && NEXT_STATUS[caseStatus]) body.newStatus = NEXT_STATUS[caseStatus];
    const res = await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMessage(advanceStatus ? "Status advanced successfully!" : "Saved successfully!");
      if (advanceStatus && NEXT_STATUS[caseStatus]) onStatusChange?.(NEXT_STATUS[caseStatus]);
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  };

  // Step 1 (new_submission): Show verification checklist instead of generic action plan
  if (caseStatus === "new_submission" || (caseStatus !== "new_submission" && caseData?.actionPlan?.startsWith("VERIFICATION:"))) {
    return (
      <VerificationChecklist
        caseId={caseId}
        caseStatus={caseStatus}
        currentUser={currentUser}
        caseData={caseData}
        onVerified={() => { window.location.reload(); }}
      />
    );
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-5 space-y-5">
      {message && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />{message}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Action Plan / Response Actions</label>
        <textarea
          value={form.actionPlan}
          onChange={e => setForm(p => ({ ...p, actionPlan: e.target.value }))}
          rows={5}
          placeholder="Describe the action plan in detail — what will be done, by whom, and by when..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Target Completion Date</label>
          <input type="date" value={form.actionPlanDueDate}
            onChange={e => setForm(p => ({ ...p, actionPlanDueDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Progress ({form.progressPercent}%)</label>
          <input type="range" min={0} max={100} step={5} value={form.progressPercent}
            onChange={e => setForm(p => ({ ...p, progressPercent: Number(e.target.value) }))}
            className="w-full mt-2"
          />
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${form.progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Intervention Plan (on-ground actions)</label>
        <textarea value={form.interventionPlan}
          onChange={e => setForm(p => ({ ...p, interventionPlan: e.target.value }))}
          rows={3}
          placeholder="Detail the physical intervention steps, resources deployed, etc..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Blockers / Challenges</label>
        <textarea value={form.blockers}
          onChange={e => setForm(p => ({ ...p, blockers: e.target.value }))}
          rows={2}
          placeholder="Note any blockers, dependencies, or challenges encountered..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
      </div>

      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button onClick={() => save(false)} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
          <Save className="w-3.5 h-3.5" />{saving ? "Saving..." : "Save Draft"}
        </button>
        {NEXT_STATUS[caseStatus] && (
          <button onClick={() => save(true)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {NEXT_LABELS[caseStatus] || "Advance"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
