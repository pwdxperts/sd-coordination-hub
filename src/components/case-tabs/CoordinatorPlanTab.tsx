"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, MapPin, FileText, Download, Lock, AlertTriangle, Save, ArrowRight, Loader, Upload, Circle } from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: "location_confirmed",   label: "Location verified" },
  { id: "description_accurate", label: "Description accurate" },
  { id: "not_duplicate",        label: "Not a duplicate" },
  { id: "within_mandate",       label: "Within mandate" },
  { id: "evidence_uploaded",    label: "Evidence uploaded" },
  { id: "contact_captured",     label: "Contact noted" },
];

const SEV_COLORS: Record<string, string> = {
  Critical: "bg-red-50 border-red-300 text-red-800",
  High:     "bg-orange-50 border-orange-300 text-orange-800",
  Moderate: "bg-amber-50 border-amber-300 text-amber-800",
  Stable:   "bg-green-50 border-green-300 text-green-800",
};

export default function CoordinatorPlanTab({
  caseId, caseStatus, currentUser, caseData, onAdvanced,
}: { caseId: string; caseStatus: string; currentUser: any; caseData: any; onAdvanced?: () => void }) {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [form, setForm] = useState({
    actionPlan: "", implementingTeam: "", resourcesRequired: "",
    actionPlanDueDate: "", progressPercent: 0, blockers: "", interventionPlan: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [additionalEvidence, setAdditionalEvidence] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isReadOnly = ["intervention","monitoring","resolved","closed"].includes(caseStatus);
  const isActionPlanStep = caseStatus === "classified" || caseStatus === "assigned";

  useEffect(() => {
    // Parse verification data from Step 1
    if (caseData?.actionPlan?.startsWith("VERIFICATION:")) {
      try { setVerificationData(JSON.parse(caseData.actionPlan.replace("VERIFICATION:", ""))); } catch {}
    }
    // Load existing evidence
    fetch(`/api/cases/${caseId}/evidence`)
      .then(r => r.ok ? r.json() : {})
      .then((d: any) => setEvidence(d.evidence || []));
    // Pre-fill form from existing data
    setForm(prev => ({
      ...prev,
      actionPlan: caseData?.actionPlan?.startsWith("VERIFICATION:") ? "" : (caseData?.actionPlan || ""),
      actionPlanDueDate: caseData?.actionPlanDueDate ? new Date(caseData.actionPlanDueDate).toISOString().split("T")[0] : "",
      progressPercent: caseData?.progressPercent || 0,
      blockers: caseData?.blockers || "",
      interventionPlan: caseData?.interventionPlan || "",
    }));
  }, [caseId, caseData]);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileUrl: base64, fileType: file.type, fileSize: file.size, description: "Coordinator plan evidence" }),
      });
      if (res.ok) {
        const d: any = await res.json();
        setAdditionalEvidence(prev => [d.evidence, ...prev]);
      }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const save = async (advance = false) => {
    setSaving(true);
    const nextStatus = caseStatus === "classified" ? "assigned" : caseStatus === "assigned" ? "action_plan" : undefined;
    const fullPlan = form.implementingTeam
      ? `${form.actionPlan}\n\nImplementing Team: ${form.implementingTeam}${form.resourcesRequired ? `\nResources: ${form.resourcesRequired}` : ""}`
      : form.actionPlan;

    await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionPlan: fullPlan,
        actionPlanDueDate: form.actionPlanDueDate || null,
        progressPercent: form.progressPercent,
        blockers: form.blockers || null,
        interventionPlan: form.interventionPlan || null,
        newStatus: advance && nextStatus ? nextStatus : undefined,
      }),
    });

    if (advance) {
      await fetch(`/api/cases/${caseId}/timeline`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: `📋 Action plan submitted by ${currentUser?.name}. Target: ${form.actionPlanDueDate || "TBD"}. Implementing: ${form.implementingTeam || "TBD"}.`,
          userId: currentUser?.id,
        }),
      });
      // Complete the task
      const tasksRes: any = await fetch(`/api/tasks?assignedToId=${currentUser?.id}`).then(r => r.json()).catch(() => ({ tasks: [] }));
      const myTask = (tasksRes.tasks || []).find((t: any) => t.caseId === caseId && t.status !== "completed");
      if (myTask) await fetch(`/api/tasks/${myTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
      onAdvanced?.();
    }

    setMessage(advance ? "Action plan submitted successfully!" : "Draft saved.");
    setTimeout(() => setMessage(""), 3000);
    setSaving(false);
  };

  const NEXT_BTN: Record<string, string> = {
    classified: "✓ Submit Action Plan & Advance",
    assigned:   "✓ Mark Action Plan Complete",
    action_plan:"✓ Begin Intervention",
    intervention:"✓ Mark Intervention Complete",
    monitoring:  "✓ Mark Resolved",
  };

  return (
    <div className="p-5 space-y-5">
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {/* ── Step 1: Verification Summary ── */}
      {verificationData && (
        <div className="border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm font-semibold text-green-900">Step 1 — Verified ✓</p>
            </div>
            <span className="text-xs text-green-600">By {verificationData.verifiedBy} · {new Date(verificationData.verifiedAt).toLocaleDateString("en-ZA")}</span>
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {verificationData.gps && (
              <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono text-blue-800">{verificationData.gps.lat.toFixed(5)}, {verificationData.gps.lng.toFixed(5)}</span>
                <a href={`https://maps.google.com/?q=${verificationData.gps.lat},${verificationData.gps.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Map →</a>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {CHECKLIST_ITEMS.map(item => (
                <span key={item.id} className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${verificationData.checklist?.[item.id] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {verificationData.checklist?.[item.id] ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />} {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Classification Summary ── */}
      <div className="border border-purple-200 rounded-xl overflow-hidden">
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <p className="text-sm font-semibold text-purple-900">Step 2 — Classified ✓</p>
          </div>
          <span className="text-xs text-purple-600">Severity · Sector · Sphere confirmed</span>
        </div>
        <div className="p-4 flex flex-wrap gap-3">
          {caseData?.severityLevel && (
            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border-2 ${SEV_COLORS[caseData.severityLevel] || "bg-gray-50 border-gray-300 text-gray-700"}`}>
              {caseData.severityLevel}
            </span>
          )}
          {caseData?.sector?.name && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">{caseData.sector.name}</span>
          )}
          {caseData?.responsibleSphere && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">{caseData.responsibleSphere} sphere</span>
          )}
          {caseData?.subCategory && (
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">{caseData.subCategory}</span>
          )}
          {caseData?.rootCause && (
            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">Root cause: {caseData.rootCause}</span>
          )}
        </div>
      </div>

      {/* ── Evidence from previous steps ── */}
      {evidence.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence from Verification ({evidence.length} file{evidence.length !== 1 ? "s" : ""})</p>
          <div className="grid grid-cols-2 gap-2">
            {evidence.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                {ev.fileType?.startsWith("image/")
                  ? <img src={ev.fileUrl} alt={ev.fileName} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                  : <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>}
                <p className="text-xs text-gray-700 truncate flex-1">{ev.fileName}</p>
                <a href={ev.fileUrl} download={ev.fileName}><Download className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" /></a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Your Action Plan (coordinator fills in) ── */}
      {!isReadOnly && (
        <div className="border border-orange-200 rounded-xl overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
            <p className="text-sm font-semibold text-orange-900">Step 3 — Your Action Plan</p>
            <p className="text-xs text-orange-700 mt-0.5">Describe exactly what will be done, by whom, when, and what resources are needed.</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Action Plan <span className="text-red-500">*</span></label>
              <textarea value={form.actionPlan} onChange={e => setForm(p => ({ ...p, actionPlan: e.target.value }))} rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                placeholder="Describe the action plan — what will be done, by whom, and in what sequence..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Implementing Team / Municipality</label>
                <input type="text" value={form.implementingTeam} onChange={e => setForm(p => ({ ...p, implementingTeam: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="e.g. Capricorn District Municipality — Technical Services" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resources Required</label>
                <input type="text" value={form.resourcesRequired} onChange={e => setForm(p => ({ ...p, resourcesRequired: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="e.g. 2 engineers, excavator, R50k budget" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Completion Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.actionPlanDueDate} onChange={e => setForm(p => ({ ...p, actionPlanDueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Progress ({form.progressPercent}%)</label>
                <input type="range" min={0} max={100} step={5} value={form.progressPercent}
                  onChange={e => setForm(p => ({ ...p, progressPercent: Number(e.target.value) }))} className="w-full mt-2" />
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${form.progressPercent}%` }} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">On-Ground Intervention Plan</label>
              <textarea value={form.interventionPlan} onChange={e => setForm(p => ({ ...p, interventionPlan: e.target.value }))} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                placeholder="Detail the physical steps that will happen on the ground: equipment, crew, sequence..." />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blockers / Dependencies</label>
              <textarea value={form.blockers} onChange={e => setForm(p => ({ ...p, blockers: e.target.value }))} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                placeholder="Any dependencies, approvals needed, or potential blockers..." />
            </div>

            {/* Upload additional evidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">Upload Supporting Documents (optional)</label>
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 cursor-pointer">
                  {uploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading..." : "Upload File"}
                  <input ref={fileRef} type="file" onChange={uploadFile} className="hidden" disabled={uploading} accept="image/*,.pdf,.doc,.docx,.xlsx" />
                </label>
              </div>
              {additionalEvidence.length > 0 && (
                <div className="space-y-1">
                  {additionalEvidence.map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {ev.fileName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read-only view for completed steps */}
      {isReadOnly && caseData?.actionPlan && !caseData.actionPlan.startsWith("VERIFICATION:") && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Action Plan (Submitted)</p>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{caseData.actionPlan}</p>
          {caseData?.actionPlanDueDate && (
            <p className="text-xs text-gray-500 mt-2">Target date: {new Date(caseData.actionPlanDueDate).toLocaleDateString("en-ZA")}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button onClick={() => save(false)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving || !form.actionPlan || !form.actionPlanDueDate}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-40 text-sm">
            {saving ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : <><ArrowRight className="w-4 h-4" /> {NEXT_BTN[caseStatus] || "Submit & Advance"}</>}
          </button>
        </div>
      )}

      {!isReadOnly && (!form.actionPlan || !form.actionPlanDueDate) && (
        <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Fill in the action plan and target date to advance.</p>
      )}
    </div>
  );
}
