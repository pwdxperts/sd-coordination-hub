"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

const LEVELS = ["L1 - Senior Coordinator", "L2 - National Director", "L3 - Minister / DG"];
const LEVEL_COLORS: Record<string,string> = {
  "L1": "bg-amber-50 border-amber-200 text-amber-800",
  "L2": "bg-orange-50 border-orange-200 text-orange-800",
  "L3": "bg-red-50 border-red-200 text-red-800",
};

export default function EscalationsTab({ caseId, caseData, currentUser, onEscalated }: any) {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ level: "L1", reason: "", escalatedTo: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/cases/${caseId}/escalate`).then(r => r.ok ? r.json() : { escalations: [] }),
      fetch("/api/users/by-step?step=escalated").then(r => r.ok ? r.json() : { users: [] }),
    ]).then(([esc, u]) => {
      setEscalations(esc.escalations || []);
      setUsers(u.users || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [caseId]);

  const submit = async () => {
    setSaving(true);
    const res = await fetch(`/api/cases/${caseId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ level: "L1", reason: "", escalatedTo: "" });
      onEscalated?.();
      load();
    }
    setSaving(false);
  };

  const resolve = async (escalationId: string, response: string) => {
    await fetch(`/api/cases/${caseId}/escalate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escalationId, status: "resolved", response }),
    });
    load();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-5 space-y-4">
      {/* Escalation explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">How escalations work</p>
        <p className="text-xs leading-relaxed">
          Escalate when a case is stalled, missed SLA, or requires senior authority.
          <strong> L1</strong> goes to a Senior Coordinator.
          <strong> L2</strong> to the National Director.
          <strong> L3</strong> to the Minister or Director-General.
          The assigned person receives an email and the case is locked to "Escalated" status until they respond.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">
          <AlertTriangle className="w-3.5 h-3.5" /> Raise Escalation
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">New Escalation</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Escalation Level</label>
            <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20">
              {["L1", "L2", "L3"].map(l => <option key={l} value={l}>{l} — {l==="L1"?"Senior Coordinator":l==="L2"?"National Director":"Minister / DG"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Escalation Reason *</label>
            <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3}
              placeholder="Why is this being escalated? What has been tried? What is blocked?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Escalate To (optional)</label>
            <select value={form.escalatedTo} onChange={e => setForm(p => ({ ...p, escalatedTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
              <option value="">Auto-assign based on level</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.role?.replace(/_/g," ")}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={submit} disabled={saving || !form.reason}
              className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Escalation"}
            </button>
          </div>
        </div>
      )}

      {escalations.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">No escalations for this case</p>
      ) : (
        <div className="space-y-3">
          {escalations.map((esc: any) => {
            const lvlKey = esc.level?.split(" ")[0] || "L1";
            return (
              <div key={esc.id} className={`border rounded-xl p-4 ${LEVEL_COLORS[lvlKey] || "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide">{esc.level}</span>
                    <p className="text-sm font-medium mt-1">{esc.reason}</p>
                    {esc.escalatedTo && <p className="text-xs mt-1">Assigned to: {esc.escalatedTo}</p>}
                    <p className="text-xs opacity-70 mt-1">{new Date(esc.escalatedAt).toLocaleDateString("en-ZA")}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${esc.status === "resolved" ? "bg-green-100 text-green-700" : "bg-white/50 text-current"}`}>
                    {esc.status}
                  </span>
                </div>
                {esc.response && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className="text-xs font-medium">Response:</p>
                    <p className="text-sm mt-0.5">{esc.response}</p>
                  </div>
                )}
                {esc.status !== "resolved" && (
                  <button onClick={() => {
                    const response = prompt("Enter your response/resolution note:");
                    if (response) resolve(esc.id, response);
                  }} className="mt-3 flex items-center gap-1 text-xs font-medium text-current hover:opacity-70">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
