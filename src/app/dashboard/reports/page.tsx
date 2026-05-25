"use client";

import { BarChart3, FileText, Download, Printer, AlertTriangle } from "lucide-react";
import Link from "next/link";

const REPORTS = [
  {
    id: "weekly",
    title: "Weekly Service Delivery Failure Report",
    description: "Consolidated report of all service delivery failures reported in the past week, including severity breakdowns and provincial distribution.",
    icon: FileText,
    frequency: "Weekly",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "monthly",
    title: "Monthly Coordination Summary",
    description: "Comprehensive monthly overview of case intake, resolution rates, escalation patterns, and coordination performance metrics.",
    icon: BarChart3,
    frequency: "Monthly",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "critical",
    title: "Critical Incident Brief",
    description: "Executive brief on all Critical severity cases with recommendations for DG/Minister intervention.",
    icon: AlertTriangle,
    frequency: "As Needed",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "provincial",
    title: "Provincial Performance Report",
    description: "Province-by-province comparison of service delivery case management, response times, and resolution rates.",
    icon: FileText,
    frequency: "Monthly",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "sector",
    title: "Sector Response Report",
    description: "Analysis of sectoral response effectiveness, highlighting best practices and areas needing improvement.",
    icon: BarChart3,
    frequency: "Monthly",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "sla",
    title: "SLA Compliance Report",
    description: "Report on SLA adherence across all severity levels, including breach analysis and escalation effectiveness.",
    icon: FileText,
    frequency: "Weekly",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export service delivery coordination reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                  <span className="text-xs text-gray-400">{report.frequency}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">{report.description}</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Generate
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Custom Report Builder</h3>
            <p className="text-sm text-blue-700 mt-1">
              Need a custom report? Select provinces, sectors, date ranges, and KPIs to generate tailored reports.
            </p>
            <p className="text-xs text-blue-500 mt-2">
              Coming soon &mdash; Custom report builder with export to PDF, Excel, and PowerPoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
