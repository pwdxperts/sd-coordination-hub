"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, CheckCircle, Circle, Upload, Loader, AlertTriangle, X, Eye, Download, FileText, Image as ImageIcon, Lock } from "lucide-react";

const CHECKLIST_ITEMS = [
  { id: "location_confirmed",   label: "Location verified",          required: true,  desc: "Confirmed the geographic location is accurate and within South Africa" },
  { id: "description_accurate", label: "Description is accurate",    required: true,  desc: "The issue described is clear, specific, and matches the sector/category" },
  { id: "not_duplicate",        label: "Not a duplicate submission",  required: true,  desc: "Checked Case Board — no existing case covers the same incident" },
  { id: "within_mandate",       label: "Within CoGTA mandate",        required: true,  desc: "This falls under cooperative governance/service delivery (not SAPS, Health, etc.)" },
  { id: "evidence_uploaded",    label: "Evidence or photo attached",  required: true,  desc: "At least one photo, report or supporting document has been uploaded" },
  { id: "contact_captured",     label: "Reporter contact noted",      required: false, desc: "Contact details captured if available (optional but recommended)" },
  { id: "severity_assessed",    label: "Severity pre-assessed",       required: false, desc: "Initial severity level assessed (will be confirmed during classification)" },
];

export default function VerificationChecklistTab({
  caseId, caseStatus, currentUser, caseData, onVerified,
}: { caseId: string; caseStatus: string; currentUser: any; caseData: any; onVerified?: () => void }) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [showAssignNext, setShowAssignNext] = useState(false);
  const [classifiers, setClassifiers] = useState<any[]>([]);
  const [selectedClassifier, setSelectedClassifier] = useState("");
  const [assigningNext, setAssigningNext] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isReadOnly = caseStatus !== "new_submission" || (currentUser && caseData?.assignedTo?.id && caseData.assignedTo.id !== currentUser.id && caseStatus !== "new_submission");
  const alreadyVerified = caseStatus !== "new_submission";

  useEffect(() => {
    // Load existing verification data if available
    if (caseData?.actionPlan && caseData.actionPlan.startsWith("VERIFICATION:")) {
      try {
        const d = JSON.parse(caseData.actionPlan.replace("VERIFICATION:", ""));
        setSavedData(d);
        setChecklist(d.checklist || {});
        setGps(d.gps || null);
        setNotes(d.notes || "");
        if (alreadyVerified) setSubmitted(true);
      } catch {}
    }
    // Load existing evidence
    fetch(`/api/cases/${caseId}/evidence`)
      .then(r => r.ok ? r.json() : { evidence: [] })
      .then((d: any) => setEvidence(d.evidence || []));
  }, [caseId, caseData]);

  const captureGPS = () => {
    setGpsLoading(true); setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by this browser"); setGpsLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`GPS error: ${err.message}. Enter coordinates manually below.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const uploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileUrl: base64, fileType: file.type, fileSize: file.size, description: "Verification evidence" }),
      });
      if (res.ok) {
        const d: any = await res.json();
        setEvidence(prev => [d.evidence, ...prev]);
        setChecklist(prev => ({ ...prev, evidence_uploaded: true }));
      }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const allRequiredDone = CHECKLIST_ITEMS.filter(i => i.required).every(i => checklist[i.id]);
  const hasEvidence = evidence.length > 0;

  const submitVerification = async () => {
    if (!allRequiredDone || !hasEvidence) return;
    setSubmitting(true);
    const verificationData = {
      type: "verification",
      checklist,
      gps,
      notes,
      evidenceCount: evidence.length,
      verifiedBy: currentUser?.name,
      verifiedAt: new Date().toISOString(),
    };

    // Save checklist data to case actionPlan field
    await fetch(`/api/cases/${caseId}/action-plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionPlan: "VERIFICATION:" + JSON.stringify(verificationData),
        newStatus: "under_verification",
      }),
    });

    // Post a timeline summary
    await fetch(`/api/cases/${caseId}/timeline`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: `✅ Verification completed by ${currentUser?.name}. GPS: ${gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Not captured"}. Evidence: ${evidence.length} file(s). Checklist: ${Object.values(checklist).filter(Boolean).length}/${CHECKLIST_ITEMS.length} items.`,
        userId: currentUser?.id,
      }),
    });

    // Mark current user's task as completed
    const tasksRes: any = await fetch(`/api/tasks?assignedToId=${currentUser?.id}`).then(r => r.json());
    const myTask = (tasksRes.tasks || []).find((t: any) => t.caseId === caseId && t.status !== "completed");
    if (myTask) {
      await fetch(`/api/tasks/${myTask.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    }

    // Load classifiers for the next step — EXCLUDE the verifier themselves
    const classRes: any = await fetch(`/api/users/by-step?step=under_verification`).then(r => r.json());
    // Filter out the current verifier so classification is always a different person
    const classifierList = (classRes.users || []).filter((u: any) => u.id !== currentUser?.id);
    setClassifiers(classifierList);
    setSubmitted(true);
    setSavedData(verificationData);
    setSubmitting(false);
    setShowAssignNext(true);
  };

  const assignToClassifier = async () => {
    if (!selectedClassifier) return;
    setAssigningNext(true);
    await fetch(`/api/cases/${caseId}/assign`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: selectedClassifier, nextStatus: "under_verification", comment: "Assigned for classification after verification" }),
    });
    setAssigningNext(false);
    setShowAssignNext(false);
    onVerified?.();
  };

  // ── READ-ONLY VIEW (for classifier and beyond) ──────────────────────────
  if (alreadyVerified && savedData) {
    const completedItems = CHECKLIST_ITEMS.filter(i => savedData.checklist?.[i.id]);
    return (
      <div className="p-5 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Verification Completed</p>
            <p className="text-xs text-green-700 mt-0.5">By {savedData.verifiedBy} on {new Date(savedData.verifiedAt).toLocaleDateString("en-ZA", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-lg">
            <Lock className="w-3 h-3" /> Read-only
          </div>
        </div>

        {/* GPS */}
        {savedData.gps && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> GPS Coordinates Captured</p>
            <p className="text-sm font-mono text-blue-900">{savedData.gps.lat.toFixed(6)}, {savedData.gps.lng.toFixed(6)}</p>
            <p className="text-xs text-blue-600 mt-0.5">Accuracy: ±{savedData.gps.accuracy}m</p>
            <a href={`https://maps.google.com/?q=${savedData.gps.lat},${savedData.gps.lng}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block">View on Google Maps →</a>
          </div>
        )}

        {/* Checklist */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Verification Checklist ({completedItems.length}/{CHECKLIST_ITEMS.length} completed)</p>
          <div className="space-y-1.5">
            {CHECKLIST_ITEMS.map(item => (
              <div key={item.id} className={`flex items-start gap-2 p-2.5 rounded-lg ${savedData.checklist?.[item.id] ? "bg-green-50" : "bg-gray-50"}`}>
                {savedData.checklist?.[item.id]
                  ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs font-medium text-gray-700">{item.label} {item.required && <span className="text-red-400">*</span>}</p>
                  <p className="text-[10px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {savedData.notes && (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-1">Verifier Notes</p>
            <p className="text-sm text-gray-700">{savedData.notes}</p>
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Evidence Uploaded ({evidence.length} file{evidence.length !== 1 ? "s" : ""})</p>
            <div className="grid grid-cols-2 gap-2">
              {evidence.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                  {ev.fileType?.startsWith("image/")
                    ? <img src={ev.fileUrl} alt={ev.fileName} className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0" />
                    : <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{ev.fileName}</p>
                    <p className="text-[10px] text-gray-400">{ev.uploadedBy}</p>
                  </div>
                  <a href={ev.fileUrl} download={ev.fileName} className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE VERIFICATION FORM ────────────────────────────────────────────
  return (
    <div className="p-5 space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900">Verification Checklist</p>
        <p className="text-xs text-blue-700 mt-0.5">Complete all required items before submitting. This information is passed to the classifier and all subsequent steps.</p>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map(item => (
          <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checklist[item.id] ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:border-gray-300"}`}>
            <div className="mt-0.5 flex-shrink-0">
              {checklist[item.id]
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Circle className="w-5 h-5 text-gray-300" />}
            </div>
            <input type="checkbox" className="hidden" checked={!!checklist[item.id]}
              onChange={e => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{item.label} {item.required && <span className="text-red-400 text-xs">*required</span>}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* GPS Capture */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> GPS Coordinates</p>
            <p className="text-xs text-gray-500">Capture your device location to confirm site coordinates</p>
          </div>
          <button onClick={captureGPS} disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {gpsLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {gpsLoading ? "Locating..." : gps ? "Re-capture" : "Capture GPS"}
          </button>
        </div>
        {gps ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-mono text-green-800 font-bold">{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</p>
            <p className="text-[10px] text-green-600 mt-0.5">Accuracy: ±{gps.accuracy}m</p>
            <a href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline">Verify on Google Maps →</a>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Click the button to capture your current GPS location.</p>
        )}
        {gpsError && <p className="text-xs text-red-500 mt-1">{gpsError}</p>}
      </div>

      {/* Evidence Upload */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Evidence / Photos <span className="text-red-400 text-xs">*required</span></p>
            <p className="text-xs text-gray-500">Upload at least one photo or document confirming the issue</p>
          </div>
          <label className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 cursor-pointer">
            {uploading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading..." : "Upload File"}
            <input ref={fileRef} type="file" onChange={uploadEvidence} className="hidden" disabled={uploading}
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls" />
          </label>
        </div>
        {evidence.length > 0 ? (
          <div className="space-y-2">
            {evidence.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                {ev.fileType?.startsWith("image/")
                  ? <img src={ev.fileUrl} alt={ev.fileName} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                  : <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>}
                <p className="text-xs text-gray-700 truncate flex-1">{ev.fileName}</p>
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No files uploaded yet. At least one file is required.</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Verification Notes <span className="text-gray-400">(optional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          placeholder="Any additional observations, concerns, or context for the classifier..." />
      </div>

      {/* Submit */}
      {(!allRequiredDone || !hasEvidence) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Before you can submit:</p>
          {CHECKLIST_ITEMS.filter(i => i.required && !checklist[i.id]).map(i => (
            <p key={i.id} className="flex items-center gap-1"><Circle className="w-3 h-3" /> {i.label}</p>
          ))}
          {!hasEvidence && <p className="flex items-center gap-1"><Circle className="w-3 h-3" /> Upload at least one evidence file</p>}
        </div>
      )}

      <button onClick={submitVerification} disabled={submitting || !allRequiredDone || !hasEvidence}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
        {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> Submit Verification & Assign to Classifier</>}
      </button>

      {/* Assign to Classifier Modal */}
      {showAssignNext && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-900">Verification Complete!</h3>
              </div>
              <p className="text-xs text-gray-500">Select a different person to classify this case. The classifier cannot be the same person who verified it.</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                ✓ Checklist complete &nbsp;·&nbsp; ✓ {evidence.length} file(s) uploaded &nbsp;{gps ? `·&nbsp; ✓ GPS captured` : ""}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assign to Classifier <span className="text-red-500">*</span></label>
                <select value={selectedClassifier} onChange={e => setSelectedClassifier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">{classifiers.length === 0 ? "No other classifiers available — add more Hub Analysts in Settings" : "Select a classifier (must be different from verifier)"}</option>
                  {classifiers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.role?.replace(/_/g," ")} {u.province ? `(${u.province})` : "(National)"}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => { setShowAssignNext(false); onVerified?.(); }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Skip for now</button>
              <button onClick={assignToClassifier} disabled={!selectedClassifier || assigningNext}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {assigningNext ? "Assigning..." : "Assign to Classifier →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
