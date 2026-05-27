"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Circle, FileText, Download, Lock, AlertTriangle, Loader, Eye, ClipboardCheck } from "lucide-react";

const MONITORING_CHECKLIST = [
  { id: "evidence_reviewed",    label: "All evidence reviewed",                  required: true,  desc: "Reviewed all photos, reports and documents uploaded during intervention" },
  { id: "work_verified",        label: "Work matches action plan",               required: true,  desc: "What was done on the ground matches what was planned in the action plan" },
  { id: "issue_resolved",       label: "Original issue actually resolved",       required: true,  desc: "The service delivery problem reported by the community has been addressed" },
  { id: "quality_acceptable",   label: "Quality of work is acceptable",          required: true,  desc: "The intervention is to a standard that will last — not a temporary fix" },
  { id: "documentation_complete","label": "Documentation is complete",           required: true,  desc: "All required reports, forms, and supporting documents have been uploaded" },
  { id: "community_confirmed",  label: "Community / ward confirmed resolution",  required: false, desc: "Community representative or ward councillor has confirmed the issue is resolved" },
  { id: "followup_needed",      label: "No further follow-up required",          required: false, desc: "No additional interventions or monitoring are needed at this stage" },
];

export default function MonitoringTab({ caseId, caseStatus, currentUser, caseData, onResolved }: {
  caseId: string; caseStatus: string; currentUser: any; caseData: any; onResolved?: () => void;
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [signOffNotes, setSignOffNotes] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [evidence, setEvidence] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isReadOnly = caseStatus === "resolved" || caseStatus === "closed";

  useEffect(() => {
    fetch(`/api/cases/${caseId}/evidence`).then(r => r.ok ? r.json() : {}).then((d: any) => setEvidence(d.evidence || []));
  }, [caseId]);

  const allRequired = MONITORING_CHECKLIST.filter(i => i.required).every(i => checklist[i.id]);

  const resolve = async () => {
    if (!allRequired || !resolutionSummary) return;
    setSaving(true);
    await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressPercent: 100, resolutionNotes: resolutionSummary, newStatus: "resolved" }),
    });
    await fetch(`/api/cases/${caseId}/timeline`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: `✅ Case RESOLVED by ${currentUser?.name}. Monitoring checklist: ${MONITORING_CHECKLIST.filter(i => checklist[i.id]).length}/${MONITORING_CHECKLIST.length} items confirmed. Summary: ${resolutionSummary}`, userId: currentUser?.id }),
    });
    const tasksRes: any = await fetch(`/api/tasks?assignedToId=${currentUser?.id}`).then(r => r.json()).catch(() => ({ tasks: [] }));
    const myTask = (tasksRes.tasks || []).find((t: any) => t.caseId === caseId && t.status !== "completed");
    if (myTask) await fetch(`/api/tasks/${myTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
    setMessage("Case marked as resolved!"); setSaving(false); onResolved?.();
  };

  return (
    <div className="p-5 space-y-5">
      {message && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{message}</div>}

      <div className={`rounded-xl border p-4 ${isReadOnly ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
        <p className="text-sm font-semibold">{isReadOnly ? "✅ Case Resolved" : "Step 7 — Monitoring & Sign-off"}</p>
        <p className="text-xs mt-0.5 text-gray-600">{isReadOnly ? "This case has been successfully resolved and closed." : "Review all evidence from the intervention, complete the sign-off checklist, and mark the case as resolved."}</p>
      </div>

      {/* Intervention summary */}
      {caseData?.interventionPlan && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5"><p className="text-sm font-semibold text-gray-800">Intervention Field Report</p></div>
          <div className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.interventionPlan}</p>
            {caseData.progressPercent > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress</span><span>{caseData.progressPercent}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${caseData.progressPercent === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${caseData.progressPercent}%` }} /></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All evidence */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-800">All Evidence ({evidence.length} file{evidence.length !== 1 ? "s" : ""})</p>
        </div>
        <div className="p-4">
          {evidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {evidence.map((ev: any) => (
                <div key={ev.id} className="relative group">
                  {ev.fileType?.startsWith("image/")
                    ? <img src={ev.fileUrl} alt={ev.fileName} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    : <div className="w-full h-28 bg-blue-50 rounded-lg border flex flex-col items-center justify-center"><FileText className="w-8 h-8 text-blue-300" /><p className="text-xs text-gray-500 px-2 truncate">{ev.fileName}</p></div>}
                  <a href={ev.fileUrl} download={ev.fileName} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100"><Download className="w-3 h-3" /></a>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">{ev.fileName}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-4">No evidence uploaded for this case.</p>}
        </div>
      </div>

      {/* Monitoring checklist */}
      {!isReadOnly && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sign-off Checklist</p>
          {MONITORING_CHECKLIST.map(item => (
            <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checklist[item.id] ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="mt-0.5">
                {checklist[item.id] ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
              </div>
              <input type="checkbox" className="hidden" checked={!!checklist[item.id]} onChange={e => setChecklist(p => ({ ...p, [item.id]: e.target.checked }))} />
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label} {item.required && <span className="text-red-400 text-xs">*</span>}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Summary <span className="text-red-500">*</span></label>
            <textarea value={resolutionSummary} onChange={e => setResolutionSummary(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
              placeholder="Summarise what was done and how the original issue was resolved. Include any lessons learned or recommendations..." />
          </div>
          {(!allRequired || !resolutionSummary) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              {!resolutionSummary && <p>• Write a resolution summary</p>}
              {MONITORING_CHECKLIST.filter(i => i.required && !checklist[i.id]).map(i => <p key={i.id}>• {i.label}</p>)}
            </div>
          )}
          <button onClick={resolve} disabled={saving || !allRequired || !resolutionSummary}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 text-sm">
            {saving ? <><Loader className="w-4 h-4 animate-spin" />Resolving...</> : <><ClipboardCheck className="w-4 h-4" />✓ Confirm & Mark Case Resolved</>}
          </button>
        </div>
      )}

      {isReadOnly && caseData?.resolutionNotes && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-900 mb-1 flex items-center gap-1.5"><Lock className="w-4 h-4" />Resolution Summary</p>
          <p className="text-sm text-green-800">{caseData.resolutionNotes}</p>
        </div>
      )}
    </div>
  );
}
