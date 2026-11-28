import { Download, Eye, EyeOff, FileText, Film, ImageIcon, MessageSquare, Upload } from "lucide-react";
import { CLIENT_DECISION, FILE_STATUS, fmtBytes, fmtDateTime } from "@/lib/format";
import { Avatar, Empty, StatusBadge } from "./ui";
import { ConfirmButton, SubmitButton } from "./client-ui";
import { addFileComment, deleteFile, reviewFile, setFileShared, setFileStatus, uploadFiles } from "@/app/(app)/projects/actions";

function Thumb({ file }) {
  const src = `/api/files/${file.id}`;
  if (file.mime.startsWith("image/")) return <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />;
  if (file.mime.startsWith("video/")) return <video src={`${src}#t=0.5`} preload="metadata" muted className="h-full w-full object-cover" />;
  const Icon = file.mime === "application/pdf" ? FileText : file.mime.startsWith("video/") ? Film : FileText;
  return <div className="flex h-full w-full items-center justify-center text-mute"><Icon size={26} /></div>;
}

/** Deliverables for one project: upload, preview, the review flow, and comments. */
export default function FilesPanel({ projectId, files, me, canReview, canShare, hasClient }) {
  return (
    <div className="space-y-5">
      <form action={uploadFiles} className="card flex flex-wrap items-center gap-3 p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <Upload size={18} className="text-gold" />
        <input type="file" name="files" multiple required className="min-w-0 flex-1 text-sm text-mute file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1.5 file:text-sm file:text-bone" />
        <label className="flex items-center gap-2 text-sm text-mute"><input type="checkbox" name="review" className="accent-[#EAB877]" /> Send for review</label>
        <SubmitButton className="btn btn-primary btn-sm" pendingText="Uploading…">Upload</SubmitButton>
      </form>

      {files.length === 0 ? (
        <div className="card"><Empty icon={ImageIcon} title="No files yet">Upload drafts, edits and final deliverables here.</Empty></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {files.map((f) => {
            const mine = f.uploadedById === me.id;
            return (
              <li key={f.id} className="card overflow-hidden">
                <div className="flex gap-4 p-4">
                  <a href={`/api/files/${f.id}`} target="_blank" className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-ink ring-1 ring-line"><Thumb file={f} /></a>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <a href={`/api/files/${f.id}`} target="_blank" className="truncate text-sm font-medium hover:text-gold" title={f.name}>{f.name}</a>
                      <StatusBadge map={FILE_STATUS} value={f.status} />
                    </div>
                    <p className="mt-1 text-xs text-mute">{fmtBytes(f.size)} · {f.uploadedBy.name} · {fmtDateTime(f.createdAt)}</p>
                    {f.reviewedBy && <p className="mt-0.5 text-xs text-mute">Reviewed by {f.reviewedBy.name}</p>}
                    {f.sharedWithClient && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gold">
                        <Eye size={12} /> Shared with client · <StatusBadge map={CLIENT_DECISION} value={f.clientStatus || "PENDING"} />
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`/api/files/${f.id}?download=1`} className="btn btn-ghost btn-sm"><Download size={13} />Download</a>
                      {(mine || canReview) && (f.status === "DRAFT" || f.status === "CHANGES_REQUESTED") && (
                        <form action={setFileStatus}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="status" value="IN_REVIEW" /><button className="btn btn-ghost btn-sm">Send for review</button></form>
                      )}
                      {canShare && hasClient && (
                        <form action={setFileShared}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="shared" value={String(!f.sharedWithClient)} />
                          {f.sharedWithClient
                            ? <button className="btn btn-ghost btn-sm"><EyeOff size={13} />Unshare</button>
                            : <button className="btn btn-ghost btn-sm"><Eye size={13} />Share with client</button>}
                        </form>
                      )}
                      {(mine || canReview) && (
                        <form action={deleteFile}><input type="hidden" name="id" value={f.id} /><ConfirmButton message={`Delete ${f.name}?`}>Delete</ConfirmButton></form>
                      )}
                    </div>
                  </div>
                </div>

                {canReview && f.status === "IN_REVIEW" && (
                  <form className="flex flex-wrap gap-2 border-t border-line bg-violet-400/[0.04] p-3">
                    <input type="hidden" name="id" value={f.id} />
                    <input name="note" placeholder="Feedback (optional)" className="input min-w-0 flex-1 py-1.5 text-sm" />
                    <button formAction={reviewFile.bind(null, "APPROVED")} className="btn btn-sm bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Approve</button>
                    <button formAction={reviewFile.bind(null, "CHANGES_REQUESTED")} className="btn btn-sm bg-red-500/10 text-red-300 hover:bg-red-500/20">Request changes</button>
                  </form>
                )}

                <details className="border-t border-line">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs text-mute hover:text-bone">
                    <MessageSquare size={13} /> {f.comments.length ? `${f.comments.length} comment${f.comments.length > 1 ? "s" : ""}` : "Comment"}
                  </summary>
                  <div className="space-y-3 px-4 pb-4">
                    {f.comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <Avatar user={c.author} size={24} />
                        <div className="min-w-0 text-sm"><span className="font-medium">{c.author.name}</span> <span className="text-xs text-mute">{fmtDateTime(c.createdAt)}</span><p className="whitespace-pre-wrap text-mute">{c.body}</p></div>
                      </div>
                    ))}
                    <form action={addFileComment} className="flex gap-2">
                      <input type="hidden" name="fileId" value={f.id} />
                      <input name="body" required placeholder="Write a comment…" className="input py-1.5 text-sm" />
                      <SubmitButton className="btn btn-ghost btn-sm">Send</SubmitButton>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
