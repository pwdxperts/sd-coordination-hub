"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Clock, AlertTriangle, ExternalLink } from "lucide-react";

export default function InterventionsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      status: "action_plan,intervention,monitoring",
      pageSize: "100",
    });
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 40) return "bg-blue-500";
    if (pct >= 20) return "bg-amber-500";
    return "bg-gray-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intervention Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor active interventions and action plan progress</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cases.map((caseItem: any) => (
          <Link
            key={caseItem.id}
            href={`/dashboard/cases/${caseItem.id}`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono text-blue-600">{caseItem.referenceNumber}</span>
                <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{caseItem.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                caseItem.severityLevel === "Critical" ? "bg-red-50 text-red-700" :
                caseItem.severityLevel === "High" ? "bg-orange-50 text-orange-700" :
                "bg-amber-50 text-amber-700"
              }`}>
                {caseItem.severityLevel}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span className="font-medium">{caseItem.progressPercent || 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(caseItem.progressPercent || 0)}`}
                  style={{ width: `${caseItem.progressPercent || 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {caseItem.province?.name || "-"}
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {caseItem.sector?.name || "-"}
              </div>
            </div>

            {caseItem.blockers && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600 truncate">{caseItem.blockers}</span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className={`px-1.5 py-0.5 rounded ${
                caseItem.status === "intervention" ? "bg-orange-50 text-orange-700" :
                caseItem.status === "action_plan" ? "bg-amber-50 text-amber-700" :
                "bg-sky-50 text-sky-700"
              }`}>
                {caseItem.status.replace(/_/g, " ")}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>
          </Link>
        ))}
        {cases.length === 0 && !loading && (
          <div className="col-span-full text-center py-12">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No active interventions</p>
          </div>
        )}
      </div>
    </div>
  );
}
function MapPin(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function Building2(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></svg>; }
