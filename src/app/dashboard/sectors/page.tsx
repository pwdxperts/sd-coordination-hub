"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, AlertTriangle, ExternalLink, Activity } from "lucide-react";

const SECTOR_TABS = [
  "Water Services", "Electricity Supply", "Waste Management",
  "Roads & Transport", "Governance & Financial Distress",
  "Human Settlements", "Environment", "Other",
];

export default function SectorsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Water Services");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentSector = stats?.casesBySector?.find((s: any) => s.name === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sector View</h1>
        <p className="text-sm text-gray-500 mt-1">Service delivery cases organized by sector</p>
      </div>

      {/* Sector Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {SECTOR_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {currentSector && (
        <div className="space-y-6">
          {/* Sector Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currentSector.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{currentSector.critical}</p>
            </div>
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">High</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{currentSector.high}</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Moderate</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{currentSector.moderate}</p>
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Severity Distribution</h3>
            <div className="space-y-3">
              {[
                { label: "Critical", value: currentSector.critical, color: "bg-red-500" },
                { label: "High", value: currentSector.high, color: "bg-orange-500" },
                { label: "Moderate", value: currentSector.moderate, color: "bg-amber-500" },
                { label: "Stable", value: currentSector.stable, color: "bg-green-500" },
              ].map((item) => {
                const pct = currentSector.total > 0 ? (item.value / currentSector.total) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">{item.label}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{item.value}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active cases in this sector */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Active Cases — {activeTab}</h3>
            <p className="text-sm text-gray-400">Use the Case Board to view all cases filtered by sector.</p>
            <Link
              href="/dashboard/cases"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Go to Case Board <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {!currentSector && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No data available for this sector</p>
        </div>
      )}
    </div>
  );
}
