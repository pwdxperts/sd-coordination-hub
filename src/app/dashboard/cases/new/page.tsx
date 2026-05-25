"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Plus, X } from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    intakeChannel: "manual",
    reporterName: "",
    reporterContact: "",
    reporterType: "hub_analyst",
    provinceId: "",
    districtId: "",
    municipalityId: "",
    ward: "",
    sectorId: "",
    failureCategoryId: "",
    subCategory: "",
    severityScore: 50,
    severityLevel: "Moderate",
    populationAffected: 0,
    publicSafetyRisk: false,
    isRecurring: false,
    rootCause: "",
    status: "new_submission",
  });

  useEffect(() => {
    // Fetch provinces and sectors for dropdowns
    fetch("/api/cases?pageSize=1")
      .then((r) => r.json())
      .then(async () => {
        // Will fetch via separate API later
        // For now we reference data from the seed
      })
      .catch(() => {});
  }, []);

  // Actually fetch provinces/sectors via the seed data
  useEffect(() => {
    // Since we don't have a dedicated lookup API, use the cases API to get structured data
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        // We can't get provinces/sectors from dashboard directly
        // Let's just populate with static data for now
      })
      .catch(() => {});
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setForm({ ...form, provinceId: val, districtId: "", municipalityId: "" });
    // We need to fetch districts - for now just update state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/cases/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to create case:", err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/cases" className="hover:text-blue-600">Cases</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Case</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
        <Link href="/dashboard/cases" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Incident Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Brief description of the service delivery failure"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Detailed description of the incident"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake Channel</label>
              <select
                value={form.intakeChannel}
                onChange={(e) => setForm({ ...form, intakeChannel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual Entry</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="municipal_report">Municipal Report</option>
                <option value="public">Public Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Name</label>
              <input
                type="text"
                value={form.reporterName}
                onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Contact</label>
              <input
                type="text"
                value={form.reporterContact}
                onChange={(e) => setForm({ ...form, reporterContact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reporter Type</label>
              <select
                value={form.reporterType}
                onChange={(e) => setForm({ ...form, reporterType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hub_analyst">Hub Analyst</option>
                <option value="public">Public</option>
                <option value="municipal_official">Municipal Official</option>
                <option value="provincial_official">Provincial Official</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <select
                value={form.provinceId}
                onChange={handleProvinceChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Province</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select
                value={form.districtId}
                onChange={(e) => setForm({ ...form, districtId: e.target.value, municipalityId: "" })}
                disabled={!form.provinceId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
              <select
                value={form.municipalityId}
                onChange={(e) => setForm({ ...form, municipalityId: e.target.value })}
                disabled={!form.districtId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Municipality</option>
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
              <input
                type="text"
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Classification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={form.sectorId}
                onChange={(e) => setForm({ ...form, sectorId: e.target.value, failureCategoryId: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sector</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failure Category</label>
              <select
                value={form.failureCategoryId}
                onChange={(e) => setForm({ ...form, failureCategoryId: e.target.value })}
                disabled={!form.sectorId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
              <input
                type="text"
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
              <textarea
                value={form.rootCause}
                onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Severity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Severity Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity Score (0-100)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.severityScore}
                  onChange={(e) => {
                    const score = parseInt(e.target.value);
                    let level = "Stable";
                    if (score >= 75) level = "Critical";
                    else if (score >= 55) level = "High";
                    else if (score >= 30) level = "Moderate";
                    setForm({ ...form, severityScore: score, severityLevel: level });
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-bold text-gray-700 w-8">{form.severityScore}</span>
              </div>
              <p className={`text-xs mt-1 font-medium ${
                form.severityLevel === "Critical" ? "text-red-600" :
                form.severityLevel === "High" ? "text-orange-600" :
                form.severityLevel === "Moderate" ? "text-amber-600" :
                "text-green-600"
              }`}>
                {form.severityLevel}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Population Affected</label>
              <input
                type="number"
                min="0"
                value={form.populationAffected}
                onChange={(e) => setForm({ ...form, populationAffected: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publicSafetyRisk}
                  onChange={(e) => setForm({ ...form, publicSafetyRisk: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Public Safety Risk</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Recurring Issue</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/dashboard/cases"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
