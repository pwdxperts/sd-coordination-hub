"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Image, File, Trash2, Download, Eye } from "lucide-react";

export default function EvidenceTab({ caseId, currentUser }: { caseId: string; currentUser?: any }) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch(`/api/cases/${caseId}/evidence`)
      .then(r => r.ok ? r.json() : { evidence: [] })
      .then(d => { setEvidence(d.evidence || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [caseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await fetch(`/api/cases/${caseId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: base64,
          fileType: file.type,
          fileSize: file.size,
          description,
        }),
      });
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      setUploading(false);
      load();
    };
    reader.readAsDataURL(file);
  };

  const deleteEvidence = async (evidenceId: string) => {
    if (!confirm("Delete this evidence file?")) return;
    await fetch(`/api/cases/${caseId}/evidence?evidenceId=${evidenceId}`, { method: "DELETE" });
    load();
  };

  const getIcon = (type: string) => {
    if (!type) return File;
    if (type.startsWith("image/")) return Image;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-5 space-y-5">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600 mb-1">Upload Evidence</p>
        <p className="text-xs text-gray-400 mb-3">Photos, documents, reports (max 5MB)</p>
        <input
          ref={fileRef} type="text" value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full max-w-xs mx-auto block px-3 py-1.5 border border-gray-200 rounded-lg text-xs mb-3 outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : "Choose File"}
          <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" disabled={uploading} accept="image/*,.pdf,.doc,.docx,.xlsx,.xls" />
        </label>
      </div>

      {/* Evidence list */}
      {evidence.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-4">No evidence uploaded yet</p>
      ) : (
        <div className="space-y-3">
          {evidence.map((ev: any) => {
            const Icon = getIcon(ev.fileType || "");
            const isImage = ev.fileType?.startsWith("image/");
            const sizeKB = ev.fileSize ? Math.round(ev.fileSize / 1024) : null;
            return (
              <div key={ev.id} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                {isImage && ev.fileUrl ? (
                  <img src={ev.fileUrl} alt={ev.fileName} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <Icon className="w-6 h-6 text-blue-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ev.fileName}</p>
                  {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{ev.uploadedBy}</span>
                    {sizeKB && <span>{sizeKB} KB</span>}
                    <span>{new Date(ev.createdAt).toLocaleDateString("en-ZA")}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {ev.fileUrl && (
                    <a href={ev.fileUrl} download={ev.fileName}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => deleteEvidence(ev.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
