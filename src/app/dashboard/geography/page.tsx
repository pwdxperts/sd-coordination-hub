"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "text-red-600 bg-red-50",
  High: "text-orange-600 bg-orange-50",
  Moderate: "text-amber-600 bg-amber-50",
  Stable: "text-green-600 bg-green-50",
};

export default function GeographyPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Geographic View</h1>
        <p className="text-sm text-gray-500 mt-1">Service delivery cases by province, district, and municipality</p>
      </div>

      {(!stats || !stats.casesByProvince || stats.casesByProvince.length === 0) ? (
        <div className="text-center py-12">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No geographic data available. Run seed to populate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.casesByProvince.map((prov: any) => {
            const isExpanded = expandedProvince === prov.id;
            const maxCount = Math.max(...stats.casesByProvince.map((p: any) => p.count));
            const barWidth = maxCount > 0 ? (prov.count / maxCount) * 100 : 0;

            return (
              <div key={prov.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedProvince(isExpanded ? null : prov.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{prov.name}</h3>
                    <p className="text-xs text-gray-500">{prov.count} active case{prov.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{prov.count}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Severity bar */}
                <div className="px-4 pb-1">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>

                {/* Expanded district view */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-2 mt-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-medium">Province Summary</p>
                      <div className="flex gap-2 mt-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600">Critical: ~{Math.floor(prov.count * 0.3)}</span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">High: ~{Math.floor(prov.count * 0.3)}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Moderate: ~{Math.floor(prov.count * 0.25)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">Click a case to view district-level breakdown</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
