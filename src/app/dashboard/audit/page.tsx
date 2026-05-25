"use client";

import { useState, useEffect } from "react";
import { Shield, Search, Download, Filter, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CASE_CREATED: "bg-green-50 text-green-700 border-green-200",
  CASE_UPDATED: "bg-blue-50 text-blue-700 border-blue-200",
  STATUS_CHANGED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ASSIGNED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CLASSIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  ESCALATED: "bg-red-50 text-red-700 border-red-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REOPENED: "bg-amber-50 text-amber-700 border-amber-200",
};

const actionBadgeStyle = (action: string) => {
  return ACTION_COLORS[action] || "bg-gray-50 text-gray-700 border-gray-200";
};

const actionLabel = (action: string) => action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<{ action: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const pageSize = 50;

  const fetchLogs = () => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (actionFilter) params.set("action", actionFilter);

    // Search is client-side filtered (combined with API pagination)
    fetch(`/api/audit?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        setLogs(data.logs || []);
        setActionTypes(data.actionTypes || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalLogs(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const filtered = search
    ? logs.filter((log) => {
        const q = search.toLowerCase();
        return (
          log.case?.referenceNumber?.toLowerCase().includes(q) ||
          log.case?.title?.toLowerCase().includes(q) ||
          log.comment?.toLowerCase().includes(q) ||
          log.user?.name?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q)
        );
      })
    : logs;

  // No audit data at all?
  const noAuditData = !loading && !error && totalLogs === 0 && actionTypes.length === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete audit trail of all system actions and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case ref, title, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
          >
            <option value="">All Actions</option>
            {actionTypes.map((at) => (
              <option key={at.action} value={at.action}>
                {actionLabel(at.action)} ({at.count})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-400">
          {totalLogs} total entr{totalLogs !== 1 ? "ies" : "y"}
        </span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Unable to fetch audit logs</p>
        </div>
      )}

      {/* No audit data message */}
      {noAuditData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Shield className="w-12 h-12 text-blue-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Audit Log Not Yet Active</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Audit log will populate as the system is used. Actions such as case creation,
            status changes, assignments, and escalations are automatically recorded.
          </p>
        </div>
      )}

      {/* Audit Table */}
      {!loading && !error && !noAuditData && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4">Date/Time</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Case</th>
                    <th className="py-3 px-4">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No entries match your filters</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log) => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-300" />
                            {new Date(log.createdAt).toLocaleString("en-ZA")}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-medium text-gray-500">
                                {(log.user?.name || "S")[0]}
                              </span>
                            </div>
                            <span className="text-gray-700">{log.user?.name || "System"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${actionBadgeStyle(log.action)}`}>
                            {actionLabel(log.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {log.case ? (
                            <div>
                              <span className="font-mono text-blue-600">{log.case.referenceNumber}</span>
                              <p className="text-gray-400 truncate max-w-[200px]">{log.case.title}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500 max-w-[300px]">
                          <span className="truncate block">{log.comment || "—"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages} ({totalLogs} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-medium text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
