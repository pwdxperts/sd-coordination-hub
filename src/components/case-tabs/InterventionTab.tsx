"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Circle, Upload, Loader, FileText, Download, Lock, AlertTriangle, ArrowRight, Save, MapPin, Camera, ClipboardList, X } from "lucide-react";

const INTERVENTION_CHECKLIST = [
  { id: "team_deployed",      label: "Team deployed on-site",            required: true,  desc: "Rapid response team has arrived at the location" },
  { id: "scope_confirmed",    label: "Scope of work confirmed",          required: true,  desc: "Actual work required matches the action plan description" },
  { id: "safety_checked",     label: "Safety assessment done",           required: true,  desc: "Site is safe for crew to work — PPE in use" },
  { id: "community_notified", label: "Community / affected parties notified", required: false, desc: "Residents or affected parties informed of intervention timeline" },
  { id: "resources_adequate", label: "Resources and equipment adequate", required: true,  desc: "All required materials and equipment are available on site" },
  { id: "work_completed",     label: "Physical work completed",          required: true,  desc: "All planned interventions have been carried out" },
  { id: "site_cleared",       label: "Site cleared and safe",            required: true,  desc: "Work area is clean, safe, and accessible" },
  { id: "photos_taken",       label: "Before/after photos taken",        required: true,  desc: "Photographic evidence uploaded showing before and after state" },
];

export default function InterventionTab({ caseId, caseStatus, currentUser, caseData, onAdvanced }: {
  caseId: string; caseStatus: string; currentUser: any; caseData: any; onAdvanced?: () => void;
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [fieldNotes, setFieldNotes] = useState(caseData?.interventionPlan || "");
  const [blockers, setBlockers] = useState(caseData?.blockers || "");
  const [progress, setProgress] = useState(caseData?.progressPercent || 0);
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isReadOnly = caseStatus === "monitoring" || caseStatus === "resolved" || caseStatus === "closed";
  const isIntervention = caseStatus === "action_plan" || caseStatus === "intervention";

  useEffect(() => {
    fetch(`/api/cases/${caseId}/evidence`).then(r => r.ok ? r.json() : {}).then((d: any) => setEvidence(d.evidence || []));
    setProgress(caseData?.progressPercent || 0);
    setFieldNotes(caseData?.interventionPlan || "");
    setBlockers(caseData?.blockers || "");
  }, [caseId, caseData]);

  const captureGPS = () => {
    setGpsLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }); setGpsLoading(false); },
      err => { setGpsLoading(false); }
    );
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target?.result as string;
      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileUrl: base64, fileType: file.type, fileSize: file.size, description: `Intervention evidence — ${file.name}` }),
      });
      if (res.ok) { const d: any = await res.json(); setEvidence(p => [d.evidence, ...p]); setChecklist(p => ({ ...p, photos_taken: true })); }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const allRequired = INTERVENTION_CHECKLIST.filter(i => i.required).every(i => checklist[i.id]);
  const hasEvidence = evidence.length > 0;

  const save = async (advance = false) => {
    setSaving(true);
    const nextStatus = caseStatus === "action_plan" ? "intervention" : "monitoring";
    await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interventionPlan: fieldNotes,
        blockers,
        progressPercent: progress,
        ...(gps ? { resolutionNotes: `GPS on-site: ${gps.lat.toFixed(5)},${gps.lng.toFixed(5)} ±${gps.accuracy}m` } : {}),
        newStatus: advance ? nextStatus : undefined,
      }),
    });
    if (advance) {
      await fetch(`/api/cases/${caseId}/timeline`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: `🔧 Intervention ${caseStatus === "intervention" ? "completed" : "started"} by ${currentUser?.name}. Progress: ${progress}%. Evidence: ${evidence.length} file(s) uploaded.${gps ? ` GPS: ${gps.lat.toFixed(5)},${gps.lng.toFixed(5)}` : ""}`, userId: currentUser?.id }),
      });
      const tasksRes: any = await fetch(`/api/tasks?assignedToId=${currentUser?.id}`).then(r => r.json()).catch(() => ({ tasks: [] }));
      const myTask = (tasksRes.tasks || []).find((t: any) => t.caseId === caseId && t.status !== "completed");
      if (myTask) await fetch(`/api/tasks/${myTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
      onAdvanced?.();
    }
    setMessage(advance ? (caseStatus === "action_plan" ? "Intervention started!" : "Intervention marked complete!") : "Progress saved.");
    setTimeout(() => setMessage(""), 3000);
    setSaving(false);
  };

  return (
    <div className="p-5 space-y-5">
      {message && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{message}</div>}

      {/* Action plan from coordinator */}
      {caseData?.actionPlan && !caseData.actionPlan.startsWith("VERIFICATION:") && (
        <div className="border border-orange-200 rounded-xl overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold text-orange-900">Coordinator's Action Plan (Your Instructions)</p>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.actionPlan}</p>
            {caseData.actionPlanDueDate && <p className="text-xs text-orange-600 mt-2 font-medium">Target date: {new Date(caseData.actionPlanDueDate).toLocaleDateString("en-ZA")}</p>}
          </div>
        </div>
      )}

      {/* GPS capture on-site */}
      {isIntervention && (
        <div className="border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" />Capture On-Site GPS</p>
            <button onClick={captureGPS} disabled={gpsLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {gpsLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {gps ? "Re-capture" : "Capture GPS"}
            </button>
          </div>
          {gps ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs">
              <span className="font-mono text-green-800 font-bold">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</span>
              <span className="text-green-600 ml-2">±{gps.accuracy}m</span>
              <a href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-3">Verify on Map →</a>
            </div>
          ) : <p className="text-xs text-gray-400">Capture your GPS to confirm you are on-site at the correct location.</p>}
        </div>
      )}

      {/* Evidence upload — before/after photos */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><Camera className="w-4 h-4 text-gray-500" />Before / During / After Evidence <span className="text-red-400 text-xs">*required</span></p>
          {isIntervention && (
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-green-700">
              {uploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload Photo / Report"}
              <input ref={fileRef} type="file" onChange={upload} className="hidden" disabled={uploading} accept="image/*,.pdf,.doc,.docx" />
            </label>
          )}
        </div>
        <div className="p-4">
          {evidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {evidence.map((ev: any) => (
                <div key={ev.id} className="relative group">
                  {ev.fileType?.startsWith("image/")
                    ? <img src={ev.fileUrl} alt={ev.fileName} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    : <div className="w-full h-28 bg-blue-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1"><FileText className="w-8 h-8 text-blue-300" /><p className="text-xs text-gray-500 px-2 text-center truncate">{ev.fileName}</p></div>}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-2 transition-opacity">
                    <a href={ev.fileUrl} download={ev.fileName} className="p-1.5 bg-white rounded-full"><Download className="w-3.5 h-3.5 text-gray-700" /></a>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">{ev.fileName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No evidence uploaded yet. Upload before/during/after photos and reports.</p>
          )}
        </div>
      </div>

      {/* Intervention Checklist */}
      {isIntervention && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Intervention Checklist</p>
          {INTERVENTION_CHECKLIST.map(item => (
            <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checklist[item.id] ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <div className="mt-0.5 flex-shrink-0">
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

      {/* Field notes & progress */}
      {isIntervention && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Field Notes / Work Report <span className="text-red-500">*</span></label>
            <textarea value={fieldNotes} onChange={e => setFieldNotes(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
              placeholder="Describe what was done on the ground — materials used, work carried out, any deviations from the plan..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Progress ({progress}%)</label>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full" />
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className={`h-2 rounded-full transition-all ${progress === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Blockers / Issues Encountered</label>
            <textarea value={blockers} onChange={e => setBlockers(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
              placeholder="Any obstacles encountered during intervention..." />
          </div>
        </div>
      )}

      {isIntervention && (!allRequired || !hasEvidence || !fieldNotes) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Required before marking complete:</p>
          {!hasEvidence && <p>• Upload at least one evidence photo or report</p>}
          {!fieldNotes && <p>• Fill in the field notes / work report</p>}
          {INTERVENTION_CHECKLIST.filter(i => i.required && !checklist[i.id]).map(i => <p key={i.id}>• {i.label}</p>)}
        </div>
      )}

      {isIntervention && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button onClick={() => save(false)} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
            <Save className="w-4 h-4" /> Save Progress
          </button>
          <button onClick={() => save(true)} disabled={saving || !allRequired || !hasEvidence || !fieldNotes}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 text-sm">
            {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving...</> : caseStatus === "action_plan" ? <><ArrowRight className="w-4 h-4" />Begin Intervention</> : <><CheckCircle className="w-4 h-4" />Mark Intervention Complete</>}
          </button>
        </div>
      )}
    </div>
  );
}
