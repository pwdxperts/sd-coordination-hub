"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare, Plus, X, ChevronDown, Clock, AlertCircle, User,
  CheckCircle2, Circle, ArrowRight, RefreshCw, Filter, Search,
  Briefcase, Calendar,
} from "lucide-react";

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Circle,
  in_progress: RefreshCw,
  completed: CheckCircle2,
  cancelled: X,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAll, setViewAll] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [progressTask, setProgressTask] = useState<any>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    title: "", description: "", priority: "medium", category: "",
    assignedToId: "", dueDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Progress modal
  const [progressForm, setProgressForm] = useState({
    status: "", notes: "", nextStep: "", nextAssigneeId: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user) setCurrentUser(d.user); });
    fetch("/api/auth/users")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.users) setUsers(d.users); });
  }, []);

  const loadTasks = () => {
    setLoading(true);
    const qs = viewAll ? "?all=true" : "";
    fetch(`/api/tasks${qs}`)
      .then((r) => r.ok ? r.json() : { tasks: [] })
      .then((d) => { setTasks(d.tasks || []); setLoading(false); });
  };

  useEffect(() => { loadTasks(); }, [viewAll]);

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.assignedTo?.name || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const handleCreate = async () => {
    if (!newTask.title) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        assignedToId: newTask.assignedToId || currentUser?.id,
        createdById: currentUser?.id,
        dueDate: newTask.dueDate || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
      setShowCreate(false);
      setNewTask({ title: "", description: "", priority: "medium", category: "", assignedToId: "", dueDate: "", notes: "" });
    }
    setSaving(false);
  };

  const handleProgress = async () => {
    if (!progressTask) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${progressTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: progressForm.status || progressTask.status,
        notes: progressForm.notes,
        nextStep: progressForm.nextStep,
        nextAssigneeId: progressForm.nextAssigneeId || null,
        assignedToId: progressForm.nextAssigneeId
          ? progressForm.nextAssigneeId
          : progressTask.assignedToId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => t.id === data.task.id ? data.task : t));
      setProgressTask(null);
    }
    setSaving(false);
  };

  const handleQuickStatus = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => t.id === data.task.id ? data.task : t));
    }
  };

  const isOverdue = (t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed" && t.status !== "cancelled";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage tasks assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewAll(!viewAll)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              viewAll ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {viewAll ? "My Tasks" : "All Tasks"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {["all", "pending", "in_progress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              statusFilter === s ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === s ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {counts[s as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm text-gray-700 bg-transparent border-none outline-none w-full"
          />
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
            {statusFilter !== "all" ? `No ${STATUS_LABELS[statusFilter].toLowerCase()} tasks` : "Create your first task to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const StatusIcon = STATUS_ICONS[task.status] || Circle;
            const overdue = isOverdue(task);
            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all hover:shadow-md ${
                  overdue ? "border-red-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleQuickStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <StatusIcon className={`w-5 h-5 ${
                      task.status === "completed" ? "text-green-500" :
                      task.status === "in_progress" ? "text-blue-500" :
                      task.status === "cancelled" ? "text-gray-400" : "text-gray-300"
                    }`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                          <Clock className="w-3 h-3" />
                          <span>{overdue ? "Overdue: " : ""}{new Date(task.dueDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      )}
                      {task.case && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Briefcase className="w-3 h-3" />
                          <span>{task.case.referenceNumber}</span>
                        </div>
                      )}
                      {task.nextAssignee && (
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <ArrowRight className="w-3 h-3" />
                          <span>Next: {task.nextAssignee.name}</span>
                        </div>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-gray-400 mt-1.5 italic">{task.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setProgressTask(task);
                        setProgressForm({ status: task.status, notes: task.notes || "", nextStep: task.nextStep || "", nextAssigneeId: task.nextAssigneeId || "" });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Update
                    </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Create New Task</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTask.assignedToId}
                  onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="">Assign to myself</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role?.replace(/_/g, " ")})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  placeholder="e.g. Field Inspection, Report Review"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={saving || !newTask.title}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Update Modal */}
      {progressTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setProgressTask(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Update Task</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{progressTask.title}</p>
              </div>
              <button onClick={() => setProgressTask(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Progress Notes</label>
                <textarea
                  value={progressForm.notes}
                  onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  placeholder="What was done? Any blockers?"
                />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assign Next Step</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Next Step Description</label>
                  <input
                    type="text"
                    value={progressForm.nextStep}
                    onChange={(e) => setProgressForm({ ...progressForm, nextStep: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="What needs to happen next?"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assign Next Step To</label>
                  <select
                    value={progressForm.nextAssigneeId}
                    onChange={(e) => setProgressForm({ ...progressForm, nextAssigneeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="">Keep current assignee</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.role?.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setProgressTask(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleProgress}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
