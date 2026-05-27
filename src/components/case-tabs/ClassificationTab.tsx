"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Circle, Tags, AlertTriangle, ChevronDown, Lock, ArrowRight, Loader, FileText, Download, MapPin } from "lucide-react";

const SEVERITY_OPTIONS = [
  { value: "Critical", label: "Critical", desc: "Immediate threat to life or complete infrastructure failure. 50,000+ people affected.", color: "border-red-400 bg-red-50 text-red-800" },
  { value: "High",     label: "High",     desc: "Major disruption. 10,000+ affected. Significant community impact.",                   color: "border-orange-400 bg-orange-50 text-orange-800" },
  { value: "Moderate", label: "Moderate", desc: "Ongoing issue, 1,000–10,000 affected. Manageable but needs action.",                  color: "border-amber-400 bg-amber-50 text-amber-800" },
  { value: "Stable",   label: "Stable",   desc: "Minor inconvenience. Under 1,000 affected. Lower urgency.",                           color: "border-green-400 bg-green-50 text-green-800" },
];

const SECTORS = ["Water Services","Electricity Supply","Roads & Transport","Waste Management","Human Settlements","Governance & Financial Distress","Health Services","Multi-Service","Infrastructure","Environment","Education","Other"];
const SPHERES = ["Municipal","Provincial","National","Shared"];
const ROOT_CAUSES = ["Aging infrastructure","Lack of maintenance","Budget shortfall","Vandalism/theft","Natural disaster","Contractor failure","Capacity constraint","Policy/regulatory gap","Other"];

export default function ClassificationTab({ caseId, caseStatus, currentUser, caseData, onClassified }: {
  caseId: string; caseStatus: string; currentUser: any; caseData: any; onClassified?: () => void;
}) {
  const [severity, setSeverity] = useState(caseData?.severityLevel || "Moderate");
  const [sector, setSector] = useState(caseData?.sector?.name || "");
  const [subCategory, setSubCategory] = useState(caseData?.subCategory || "");
  const [rootCause, setRootCause] = useState(caseData?.rootCause || "");
  const [responsibleSphere, setResponsibleSphere] = useState(caseData?.responsibleSphere || "Municipal");
  const [classificationNotes, setClassificationNotes] = useState("");
  const [sectors, setSectors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Verification data from previous step
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verificationEvidence, setVerificationEvidence] = useState<any[]>([]);

  const isReadOnly = caseStatus !== "under_verification";
  const alreadyClassified = ["classified","assigned","action_plan","intervention","monitoring","resolved","closed"].includes(caseStatus);

  useEffect(() => {
    // Load sectors from API
    fetch("/api/sectors").then(r => r.ok ? r.json() : {}).then((d: any) => setSectors(d.sectors || []));

    // Parse verification data from previous step
    if (caseData?.actionPlan?.startsWith("VERIFICATION:")) {
      try { setVerificationData(JSON.parse(caseData.actionPlan.replace("VERIFICATION:", ""))); } catch {}
    }

    // Load evidence from verification step
    fetch(`/api/cases/${caseId}/evidence`).then(r => r.ok ? r.json() : {}).then((d: any) => setVerificationEvidence(d.evidence || []));

    // Pre-fill from existing classification if returning to this step
    if (caseData?.severityLevel) setSeverity(caseData.severityLevel);
    if (caseData?.sector?.name) setSector(caseData.sector.name);
  }, [caseId, caseData]);

  const classify = async (andAssign = false) => {
    setSaving(true);
    // Find sector ID
    const sectorObj = sectors.find((s: any) => s.name === sector);
    const res = await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus: "classified",
        ...(sectorObj ? { sectorId: sectorObj.id } : {}),
      }),
    });
    // Also update severity, sector, root cause via PATCH
    await fetch(`/api/cases/${caseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severityLevel: severity,
        subCategory: subCategory || undefined,
        rootCause: rootCause || undefined,
        responsibleSphere,
        ...(sectorObj ? { sectorId: sectorObj.id } : {}),
      }),
    });
    // Post to timeline
    await fetch(`/api/cases/${caseId}/timeline`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: `📋 Case classified by ${currentUser?.name}: Severity=${severity}, Sector=${sector}, Responsible sphere=${responsibleSphere}${rootCause ? `, Root cause=${rootCause}` : ""}${classificationNotes ? `. Notes: ${classificationNotes}` : ""}.`,
        userId: currentUser?.id,
      }),
    });
    // Mark task as completed
    const tasksRes: any = await fetch(`/api/tasks?assignedToId=${currentUser?.id}`).then(r => r.json()).catch(() => ({ tasks: [] }));
    const myTask = (tasksRes.tasks || []).find((t: any) => t.caseId === caseId && t.status !== "completed");
    if (myTask) {
      await fetch(`/api/tasks/${myTask.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
    }
    setSaving(false);
    setSaved(true);
    onClassified?.();
  };

  // ── READ-ONLY for classified+ steps ────────────────────────────────────
  if (alreadyClassified) {
    return (
      <div className="p-5 space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Tags className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Classification Complete</p>
              <p className="text-xs text-purple-700">Severity: {caseData?.severityLevel} · Sector: {caseData?.sector?.name || sector} · Sphere: {caseData?.responsibleSphere}</p>
            </div>
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1"><Lock className="w-3 h-3" /> Read-only</span>
        </div>

        {/* Verification summary from Step 1 */}
        {verificationData && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm font-semibold text-green-900">Step 1 — Verification Summary</p>
              <span className="text-xs text-green-600 ml-auto">By {verificationData.verifiedBy}</span>
            </div>
            <div className="p-4 space-y-3">
              {verificationData.gps && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono">{verificationData.gps.lat.toFixed(5)}, {verificationData.gps.lng.toFixed(5)}</span>
                  <a href={`https://maps.google.com/?q=${verificationData.gps.lat},${verificationData.gps.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">Map →</a>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "location_confirmed", label: "Location verified" },
                  { id: "description_accurate", label: "Description accurate" },
                  { id: "not_duplicate", label: "Not duplicate" },
                  { id: "within_mandate", label: "Within mandate" },
                  { id: "evidence_uploaded", label: "Evidence uploaded" },
                  { id: "contact_captured", label: "Contact captured" },
                ].map(item => (
                  <div key={item.id} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg ${verificationData.checklist?.[item.id] ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`}>
                    {verificationData.checklist?.[item.id] ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {item.label}
                  </div>
                ))}
              </div>
              {verificationData.notes && <p className="text-xs text-gray-500 italic">Notes: {verificationData.notes}</p>}
            </div>
          </div>
        )}

        {/* Evidence from verification */}
        {verificationEvidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verification Evidence ({verificationEvidence.length} file{verificationEvidence.length !== 1 ? "s" : ""})</p>
            <div className="grid grid-cols-2 gap-2">
              {verificationEvidence.map((ev: any) => (
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
      </div>
    );
  }

  // ── ACTIVE CLASSIFICATION FORM ─────────────────────────────────────────
  return (
    <div className="p-5 space-y-5">
      {/* Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-900">Step 2 — Classify This Case</p>
        <p className="text-xs text-purple-700 mt-0.5">Review the verification data below, then set the severity, sector, root cause and responsible sphere. Click Classify to advance the case.</p>
      </div>

      {/* Verification data from Step 1 */}
      {verificationData && (
        <div className="border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm font-semibold text-green-900">Step 1 Verification — Passed ✓</p>
            <span className="text-xs text-green-600 ml-auto">By {verificationData.verifiedBy} · {new Date(verificationData.verifiedAt).toLocaleDateString("en-ZA")}</span>
          </div>
          <div className="p-4 space-y-3">
            {verificationData.gps && (
              <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono text-blue-800 font-medium">{verificationData.gps.lat.toFixed(5)}, {verificationData.gps.lng.toFixed(5)}</span>
                <span className="text-blue-500">±{verificationData.gps.accuracy}m</span>
                <a href={`https://maps.google.com/?q=${verificationData.gps.lat},${verificationData.gps.lng}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-auto">Confirm on Map →</a>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: "location_confirmed", label: "Location confirmed" },
                { id: "description_accurate", label: "Description accurate" },
                { id: "not_duplicate", label: "Not a duplicate" },
                { id: "within_mandate", label: "Within mandate" },
                { id: "evidence_uploaded", label: "Evidence uploaded" },
                { id: "contact_captured", label: "Contact noted" },
              ].map(item => (
                <div key={item.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${verificationData.checklist?.[item.id] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {verificationData.checklist?.[item.id] ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 flex-shrink-0" />}
                  {item.label}
                </div>
              ))}
            </div>
            {verificationData.notes && <div className="bg-white rounded-lg p-2 border border-green-100 text-xs text-gray-600"><span className="font-medium">Verifier notes: </span>{verificationData.notes}</div>}
          </div>
        </div>
      )}

      {/* Evidence uploaded by verifier */}
      {verificationEvidence.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Evidence from Verifier ({verificationEvidence.length} file{verificationEvidence.length !== 1 ? "s" : ""})</p>
          <div className="grid grid-cols-2 gap-2">
            {verificationEvidence.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                {ev.fileType?.startsWith("image/")
                  ? <img src={ev.fileUrl} alt={ev.fileName} className="w-10 h-10 object-cover rounded flex-shrink-0 border border-gray-200" />
                  : <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-700 truncate">{ev.fileName}</p>
                  <p className="text-[10px] text-gray-400">{ev.uploadedBy}</p>
                </div>
                <a href={ev.fileUrl} download={ev.fileName} className="text-blue-400 hover:text-blue-600 flex-shrink-0"><Download className="w-3.5 h-3.5" /></a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Classification form ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-3">
          <p className="text-sm font-semibold text-purple-900">Your Classification</p>
        </div>
        <div className="p-4 space-y-4">

          {/* Severity — card picker */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Severity Level <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSeverity(opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${severity === opt.value ? opt.color + " border-opacity-100" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed opacity-80">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Sector <span className="text-red-500">*</span></label>
            <select value={sector} onChange={e => setSector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400">
              <option value="">Select the affected sector</option>
              {sectors.length > 0
                ? sectors.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)
                : SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sub-category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Category / Specific Issue</label>
            <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="e.g. Burst water main, Transformer failure, Pothole..." />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Root Cause</label>
            <select value={rootCause} onChange={e => setRootCause(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20">
              <option value="">Select root cause (optional)</option>
              {ROOT_CAUSES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Responsible Sphere */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible Sphere <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {SPHERES.map(s => (
                <button key={s} onClick={() => setResponsibleSphere(s)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${responsibleSphere === s ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Classification Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Classification Notes</label>
            <textarea value={classificationNotes} onChange={e => setClassificationNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              placeholder="Any additional context for the coordinator or assignee..." />
          </div>
        </div>
      </div>

      {/* Validation message */}
      {(!severity || !sector || !responsibleSphere) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Required: Severity level, Sector, and Responsible sphere must be set before classifying.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={() => classify(false)} disabled={saving || !severity || !sector || !responsibleSphere}
          className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-40 text-sm flex items-center justify-center gap-2">
          {saving ? <><Loader className="w-4 h-4 animate-spin" /> Classifying...</> : <><Tags className="w-4 h-4" /> Classify Case</>}
        </button>
      </div>
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Case classified successfully. Now use the Assign button above to assign to a coordinator.
        </div>
      )}
    </div>
  );
}
