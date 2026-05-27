"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare, Plus, X, Clock, AlertCircle, User,
  CheckCircle2, Circle, ArrowRight, RefreshCw, Search,
  Briefcase, ChevronRight, AlertTriangle, FileText, Upload,
  Shield, Eye, ClipboardList,
} from "lucide-react";

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600", medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700", critical: "bg-red-50 text-red-700",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

// What each case step requires the assignee to do
const CASE_STEP_ACTIONS: Record<string, { label: string; description: string; buttonLabel: string; buttonIcon: string; color: string }> = {
  new_submission:     { label: "Verify Submission",        description: "Review this case and mark it as verified if genuine, or reject with a reason.", buttonLabel: "Open & Verify",        buttonIcon: "check",   color: "blue" },
  under_verification: { label: "Classify Case",            description: "Set the severity level and sector for this case, then classify it.",            buttonLabel: "Open & Classify",      buttonIcon: "filter",  color: "purple" },
  classified:         { label: "Assign to Coordinator",    description: "Assign this case to the right provincial coordinator or team.",                 buttonLabel: "Open & Assign",        buttonIcon: "user",    color: "teal" },
  assigned:           { label: "Submit Action Plan",        description: "Write and submit a detailed action plan with timeline and target dates.",        buttonLabel: "Open & Write Plan",    buttonIcon: "file",    color: "orange" },
  action_plan:        { label: "Begin Intervention",        description: "Start the on-ground work. Upload evidence and update your progress.",           buttonLabel: "Open & Update",        buttonIcon: "upload",  color: "red" },
  intervention:       { label: "Upload Evidence & Progress","description": "Upload field photos/reports and update your progress % towards completion.",  buttonLabel: "Open & Upload",        buttonIcon: "upload",  color: "amber" },
  monitoring:         { label: "Verify & Close Case",       description: "Review the evidence, confirm completion, and mark the case as resolved.",       buttonLabel: "Open & Resolve",       buttonIcon: "check",   color: "green" },
  escalated:          { label: "Respond to Escalation",    description: "This case is escalated and requires your urgent response.",                     buttonLabel: "Open & Respond",       buttonIcon: "alert",   color: "red" },
  resolved:           { label: "Close Case",               description: "Review the resolution and formally close this case.",                           buttonLabel: "Open Case",            buttonIcon: "check",   color: "gray" },
};

const SEV_COLORS: Record<string, string> = {
  Critical: "text-red-600 bg-red-50 border-red-200",
  High: "text-orange-600 bg-orange-50 border-orange-200",
  Moderate: "text-amber-600 bg-amber-50 border-amber-200",
  Stable: "text-green-600 bg-green-50 border-green-200",
};

const STEP_COLORS: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50",
  purple: "border-purple-200 bg-purple-50",
  teal: "border-teal-200 bg-teal-50",
  orange: "border-orange-200 bg-orange-50",
  red: "border-red-200 bg-red-50",
  amber: "border-amber-200 bg-amber-50",
  green: "border-green-200 bg-green-50",
  gray: "border-gray-200 bg-gray-50",
};

const STEP_BADGE_COLORS: Record<string, string> = {
  blue: "bg-blue-600", purple: "bg-purple-600", teal: "bg-teal-600",
  orange: "bg-orange-600", red: "bg-red-600", amber: "bg-amber-600",
  green: "bg-green-600", gray: "bg-gray-500",
};

function ActionIcon({ icon, cls }: { icon: string; cls: string }) {
  if (icon === "check") return <CheckCircle2 className={`w-3.5 h-3.5 ${cls}`} />;
  if (icon === "upload") return <Upload className={`w-3.5 h-3.5 ${cls}`} />;
  if (icon === "alert") return <AlertTriangle className={`w-3.5 h-3.5 ${cls}`} />;
  if (icon === "file") return <FileText className={`w-3.5 h-3.5 ${cls}`} />;
  if (icon === "user") return <User className={`w-3.5 h-3.5 ${cls}`} />;
  if (icon === "filter") return <ClipboardList className={`w-3.5 h-3.5 ${cls}`} />;
  return <Eye className={`w-3.5 h-3.5 ${cls}`} />;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAll, setViewAll] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [progressTask, setProgressTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", category: "", assignedToId: "", dueDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [progressForm, setProgressForm] = useState({ status: "", notes: "", nextStep: "", nextAssigneeId: "" });

  useEffect(() => {
    // First get current user, then load their tasks
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setCurrentUser(d.user);
          loadTasks(d.user.id, false);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    fetch("/api/auth/users").then(r => r.ok ? r.json() : {}).then(d => setUsers(d.users || []));
  }, []);

  const loadTasks = (userId?: string, all?: boolean) => {
    setLoading(true);
    const uid = userId || currentUser?.id;
    const url = all ? "/api/tasks?all=true" : (uid ? `/api/tasks?assignedToId=${uid}` : "/api/tasks?assignedToId=__none__");
    fetch(url)
      .then(r => r.ok ? r.json() : { tasks: [] })
      .then(d => { setTasks(d.tasks || []); setLoading(false); });
  };

  useEffect(() => {
    if (currentUser) loadTasks(currentUser.id, viewAll);
  }, [viewAll]);

  const filteredTasks = tasks.filter(t => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.case?.referenceNumber?.toLowerCase().includes(q) ||
      t.case?.title?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  const handleCreate = async () => {
    if (!newTask.title) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, assignedToId: newTask.assignedToId || currentUser?.id, createdById: currentUser?.id }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks(prev => [d.task, ...prev]);
      setShowCreate(false);
      setNewTask({ title: "", description: "", priority: "medium", category: "", assignedToId: "", dueDate: "", notes: "" });
    }
    setSaving(false);
  };

  const handleProgress = async () => {
    if (!progressTask) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${progressTask.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: progressForm.status || progressTask.status,
        notes: progressForm.notes,
        nextStep: progressForm.nextStep,
        nextAssigneeId: progressForm.nextAssigneeId || null,
        assignedToId: progressForm.nextAssigneeId ? progressForm.nextAssigneeId : progressTask.assignedToId,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks(prev => prev.map(t => t.id === d.task.id ? d.task : t));
      setProgressTask(null);
    }
    setSaving(false);
  };

  const handleQuickComplete = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks(prev => prev.map(t => t.id === d.task.id ? d.task : t));
    }
  };

  const isOverdue = (t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed" && t.status !== "cancelled";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {viewAll ? "All Tasks" : `My Tasks`}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentUser ? `Logged in as: ${currentUser.name} — ${currentUser.role?.replace(/_/g," ")}` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewAll(!viewAll); }}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${viewAll ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
            {viewAll ? "My Tasks Only" : "View All Tasks"}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["all","pending","in_progress","completed"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${statusFilter === s ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === s ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {counts[s as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-72">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input type="text" placeholder="Search tasks or case reference..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="text-sm text-gray-700 bg-transparent border-none outline-none w-full" />
        </div>
        <span className="text-xs text-gray-400">{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No tasks found</p>
          <p className="text-xs text-gray-300 mt-1">
            {!viewAll && tasks.length === 0 ? "No tasks assigned to you yet. Tasks appear here when a case is assigned to you." : "Try adjusting your filters."}
          </p>
          {!viewAll && tasks.length === 0 && (
            <button onClick={() => { setViewAll(true); }} className="mt-3 text-xs text-blue-600 hover:underline">
              View all tasks in the system
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => {
            const caseStep = task.case?.status;
            const stepAction = caseStep ? CASE_STEP_ACTIONS[caseStep] : null;
            const stepColor = stepAction?.color || "gray";
            const isCompleted = task.status === "completed";
            const overdue = isOverdue(task);

            return (
              <div key={task.id}
                className={`bg-white rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  overdue ? "border-red-200" : isCompleted ? "border-gray-100 opacity-70" : "border-gray-200"
                }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <button onClick={() => !isCompleted && handleQuickComplete(task.id)}
                      className="mt-0.5 flex-shrink-0" title={isCompleted ? "Completed" : "Click to mark complete"}>
                      {isCompleted
                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                        : task.status === "in_progress"
                          ? <RefreshCw className="w-5 h-5 text-blue-500" />
                          : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Task title row */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className={`text-sm font-semibold ${isCompleted ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </div>
                      </div>

                      {/* Task description (from assign — what they need to do) */}
                      {task.description && !isCompleted && (
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{task.description}</p>
                      )}

                      {/* Case info + step action banner */}
                      {task.case && (
                        <div className={`rounded-lg border p-3 mb-2 ${stepColor && STEP_COLORS[stepColor] ? STEP_COLORS[stepColor] : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-bold text-gray-700">{task.case.referenceNumber}</span>
                                {task.case.severityLevel && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${SEV_COLORS[task.case.severityLevel] || "bg-gray-50 text-gray-500"}`}>
                                    {task.case.severityLevel}
                                  </span>
                                )}
                                {task.case.province?.name && (
                                  <span className="text-[10px] text-gray-500">{task.case.province.name}</span>
                                )}
                              </div>
                              {stepAction && !isCompleted && (
                                <p className="text-xs font-semibold text-gray-800">{stepAction.label}</p>
                              )}
                              <p className="text-xs text-gray-600 truncate max-w-md">{task.case.title}</p>
                            </div>
                            {/* Primary CTA */}
                            {!isCompleted && (
                              <Link href={`/dashboard/cases/${task.case.id}`}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap flex-shrink-0 ${
                                  stepColor && STEP_BADGE_COLORS[stepColor] ? STEP_BADGE_COLORS[stepColor] : "bg-blue-600"
                                } hover:opacity-90 transition-opacity`}>
                                <ActionIcon icon={stepAction?.buttonIcon || "eye"} cls="w-3.5 h-3.5 text-white" />
                                {stepAction?.buttonLabel || "Open Case"}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{task.assignedTo.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                            <Clock className="w-3 h-3" />
                            <span>{overdue ? "OVERDUE: " : ""}{new Date(task.dueDate).toLocaleDateString("en-ZA", { day:"numeric", month:"short", year:"numeric" })}</span>
                          </div>
                        )}
                        {task.nextAssignee && (
                          <div className="flex items-center gap-1 text-purple-500">
                            <ArrowRight className="w-3 h-3" />
                            <span>Next: {task.nextAssignee.name}</span>
                          </div>
                        )}
                      </div>

                      {task.notes && !isCompleted && (
                        <p className="text-xs text-gray-400 mt-1.5 italic">{task.notes}</p>
                      )}
                    </div>

                    {/* Secondary actions */}
                    {!isCompleted && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => {
                          setProgressTask(task);
                          setProgressForm({ status: task.status, notes: task.notes || "", nextStep: task.nextStep || "", nextAssigneeId: task.nextAssigneeId || "" });
                        }} className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200">
                          <RefreshCw className="w-3 h-3" /> Update
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Create New Task</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Task title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  placeholder="What needs to be done?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assign To</label>
                <select value={newTask.assignedToId} onChange={e => setNewTask({ ...newTask, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Assign to myself</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.role?.replace(/_/g," ")}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !newTask.title}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {progressTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setProgressTask(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Update Task</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">{progressTask.title}</p>
              </div>
              <button onClick={() => setProgressTask(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={progressForm.status} onChange={e => setProgressForm({ ...progressForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Progress Notes</label>
                <textarea value={progressForm.notes} onChange={e => setProgressForm({ ...progressForm, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="What was done? Any blockers or issues?" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forward to Next Person</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assign Next Step To</label>
                  <select value={progressForm.nextAssigneeId} onChange={e => setProgressForm({ ...progressForm, nextAssigneeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Keep current assignee</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.role?.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setProgressTask(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleProgress} disabled={saving}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
