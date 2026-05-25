"use client";

import { useState, useEffect } from "react";
import { FileText, AlertTriangle, TrendingUp, AlertCircle, Printer } from "lucide-react";

export default function ExecutivePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Sort provinces and sectors by count
  const topProvinces = [...(stats?.casesByProvince || [])].sort((a, b) => b.count - a.count);
  const topSectors = [...(stats?.casesBySector || [])].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Briefing</h1>
          <p className="text-sm text-gray-500 mt-1">National Service Delivery Overview &mdash; For DG / Minister</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 no-print"
        >
          <Printer className="w-4 h-4" />
          Print Brief
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Total Active</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalCases || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Critical</p>
            <p className="text-3xl font-bold mt-1">{stats?.bySeverity?.critical || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">High</p>
            <p className="text-3xl font-bold mt-1">{stats?.bySeverity?.high || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-bold mt-1">{stats?.resolvedCases || 0}</p>
          </div>
        </div>
      </div>

      {/* Top 10 Critical */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h2 className="text-sm font-semibold text-gray-700">Top Critical Cases</h2>
        </div>
        <div className="space-y-2">
          {stats?.recentCritical?.slice(0, 10).map((caseItem: any, i: number) => (
            <div key={caseItem.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <span className="text-xs font-bold text-gray-400 w-6">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{caseItem.title}</p>
                <p className="text-xs text-gray-500">{caseItem.province?.name} &middot; {caseItem.sector?.name}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                caseItem.severityLevel === "Critical" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
              }`}>
                {caseItem.severityLevel}
              </span>
            </div>
          ))}
          {(!stats?.recentCritical || stats.recentCritical.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">No critical cases</p>
          )}
        </div>
      </div>

      {/* Province Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Province Ranking</h2>
          <div className="space-y-2">
            {topProvinces.map((prov: any, i: number) => (
              <div key={prov.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{prov.name}</span>
                    <span className="text-sm font-bold text-gray-900">{prov.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${topProvinces[0]?.count > 0 ? (prov.count / topProvinces[0].count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sector Ranking</h2>
          <div className="space-y-2">
            {topSectors.map((sector: any, i: number) => (
              <div key={sector.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{sector.name}</span>
                    <span className="text-sm font-bold text-gray-900">{sector.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${topSectors[0]?.total > 0 ? (sector.total / topSectors[0].total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Actions</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {stats?.bySeverity?.critical > 5 && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{stats.bySeverity.critical} critical cases require immediate attention and possible DG intervention</span>
                </li>
              )}
              {stats?.overdueCases > 3 && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{stats.overdueCases} cases past SLA deadline &mdash; review escalation process</span>
                </li>
              )}
              {topProvinces[0] && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{topProvinces[0].name} has the highest case load ({topProvinces[0].count} cases)</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Print footer */}
      <div className="text-center text-xs text-gray-400 no-print">
        <p>Generated {new Date().toLocaleString()} &mdash; National Service Delivery Coordination Hub</p>
      </div>
    </div>
  );
}
