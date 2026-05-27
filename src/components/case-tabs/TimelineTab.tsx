"use client";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, FileText, AlertTriangle, Activity, Send } from "lucide-react";

const ACTION_ICONS: Record<string,any> = {
  assigned: Activity, status_changed: Activity, comment_added: MessageSquare,
  evidence_uploaded: FileText, escalated: AlertTriangle, action_plan_updated: Activity,
};

const ACTION_COLORS: Record<string,string> = {
  assigned: "bg-blue-100 text-blue-600",
  status_changed: "bg-purple-100 text-purple-600",
  comment_added: "bg-gray-100 text-gray-600",
  evidence_uploaded: "bg-green-100 text-green-600",
  escalated: "bg-red-100 text-red-600",
  action_plan_updated: "bg-amber-100 text-amber-600",
};

export default function TimelineTab({ caseId, currentUserId }: { caseId: string; currentUserId?: string }) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/cases/${caseId}/timeline`)
      .then(r => r.ok ? r.json() : { timeline: [] })
      .then(d => { setTimeline(d.timeline || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [caseId]);

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    await fetch(`/api/cases/${caseId}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, userId: currentUserId }),
    });
    setComment("");
    setPosting(false);
    load();
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-5">
      {/* Comment input */}
      <div className="mb-5 flex gap-2">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment or progress update..."
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
        <button onClick={postComment} disabled={posting || !comment.trim()}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-end">
          <Send className="w-3.5 h-3.5" />{posting ? "..." : "Post"}
        </button>
      </div>

      {/* Timeline entries */}
      {timeline.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No activity yet for this case</p>
      ) : (
        <div className="space-y-4">
          {timeline.map((entry: any, i: number) => {
            const Icon = ACTION_ICONS[entry.data?.action || entry.type] || Activity;
            const colorClass = ACTION_COLORS[entry.data?.action || entry.type] || "bg-gray-100 text-gray-500";
            const date = new Date(entry.date);
            const label =
              entry.type === "comment" ? "Comment" :
              entry.type === "evidence" ? `Evidence: ${entry.data?.fileName}` :
              entry.type === "escalation" ? `Escalated to ${entry.data?.level}` :
              (entry.data?.action || "Activity").replace(/_/g, " ");
            const detail = entry.data?.comment || entry.data?.reason || entry.data?.description || "";
            const who = entry.data?.user?.name || entry.data?.uploadedBy || entry.data?.escalatedTo || "";

            return (
              <div key={i} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{label}</p>
                      {who && <p className="text-xs text-blue-600">{who}</p>}
                      {detail && <p className="text-sm text-gray-600 mt-1">{detail}</p>}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {date.toLocaleDateString("en-ZA", { day:"numeric", month:"short" })} {date.toLocaleTimeString("en-ZA", { hour:"2-digit", minute:"2-digit" })}
                    </p>
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
