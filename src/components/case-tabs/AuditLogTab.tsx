"use client";
import { useState, useEffect } from "react";
import { Shield, User, Clock } from "lucide-react";

const ACTION_COLORS: Record<string,string> = {
  assigned: "text-blue-600 bg-blue-50",
  status_changed: "text-purple-600 bg-purple-50",
  comment_added: "text-gray-600 bg-gray-100",
  evidence_uploaded: "text-green-600 bg-green-50",
  escalated: "text-red-600 bg-red-50",
  action_plan_updated: "text-amber-600 bg-amber-50",
  created: "text-teal-600 bg-teal-50",
};

export default function AuditLogTab({ caseId }: { caseId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/audit`)
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => { setLogs(d.logs || []); setLoading(false); });
  }, [caseId]);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-5">
      {logs.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No audit entries yet</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const colorClass = ACTION_COLORS[log.action] || "text-gray-600 bg-gray-100";
            return (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${colorClass}`}>
                  {log.action?.replace(/_/g," ")}
                </div>
                <div className="flex-1 min-w-0">
                  {log.comment && <p className="text-sm text-gray-700">{log.comment}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {log.user?.name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.user.name}</span>}
                    {log.ipAddress && <span>{log.ipAddress}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleString("en-ZA")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
