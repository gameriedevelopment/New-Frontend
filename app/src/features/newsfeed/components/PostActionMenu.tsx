import { Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { useCreateReport, useDeletePost, useEditPost } from "../hooks";
import type { FeedPost } from "../types";
import { CommentDialog } from "./CommentDialog";
import { RepostEmbed } from "./RepostEmbed";
import { RichPostEditor } from "./RichPostEditor";

type Mode = "edit" | "delete" | "report" | null;
type ReportKind = "spam" | "harassment" | "inappropriate" | "other";

function authorId(post: FeedPost) {
  return String(post.authorId ?? post.author?.id ?? post.userId ?? post.user?.id ?? "");
}

export function PostActionMenu({
  canDeleteOverride = false,
  post,
  single,
}: {
  canDeleteOverride?: boolean;
  post: FeedPost;
  single: boolean;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [content, setContent] = useState(post.content ?? "");
  const [reportType, setReportType] = useState<ReportKind>("spam");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const edit = useEditPost(post);
  const remove = useDeletePost(post);
  const report = useCreateReport();
  const owner = Boolean(user?.id && user.id === authorId(post));
  const canDelete = owner || canDeleteOverride;
  const reportable = true;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!user || (!owner && !canDelete && !reportable)) return null;

  const save = async () => {
    if (!content.trim() || content.trim().length > 2000) return;
    try {
      await edit.mutateAsync(content.trim());
      setMode(null);
    } catch {
      /* Contextual error below. */
    }
  };
  const destroy = async () => {
    try {
      await remove.mutateAsync();
      setMode(null);
      if (single) navigate("/feed", { replace: true });
    } catch {
      /* Contextual error below. */
    }
  };
  const submitReport = async () => {
    if (reason.trim().length < 10) return;
    try {
      const contentType = post.hubId ? "hub-post" : post.teamId ? "team-post" : "post";
      await report.mutateAsync({
        contentId: post.id,
        contentType,
        contentAuthorId: authorId(post),
        reporterId: user.id,
        type: reportType,
        reason: reason.trim(),
      });
      setMode(null);
      setReason("");
      setReportType("spam");
      setStatus("Report submitted");
      window.setTimeout(() => setStatus(null), 2600);
    } catch {
      /* Contextual error below. */
    }
  };

  return (
    <div className="post-action-menu" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Post options"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div role="menu">
          {owner ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setContent(post.content ?? "");
                setMode("edit");
              }}
            >
              <Pencil size={14} />
              Edit post
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMode("delete");
              }}
            >
              <Trash2 size={14} />
              Delete post
            </button>
          ) : null}
          {!owner && reportable ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMode("report");
              }}
            >
              <Flag size={14} />
              Report post
            </button>
          ) : null}
        </div>
      ) : null}
      {status ? (
        <p className="post-action-menu__status" role="status">
          {status}
        </p>
      ) : null}
      {mode === "edit" ? (
        <CommentDialog title="Edit post" onClose={() => setMode(null)}>
          <RichPostEditor
            expanded
            value={content}
            onChange={setContent}
            onSubmit={save}
            placeholder="Update your post…"
          />
          <p className="comment-dialog__count">{content.length} / 2000</p>
          {post.repostOf ? <RepostEmbed post={post.repostOf} /> : null}
          {edit.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(edit.error, "The post could not be updated.")}
            </p>
          ) : null}
          <footer>
            <button type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="is-primary"
              disabled={!content.trim() || content.length > 2000 || edit.isPending}
              onClick={save}
            >
              {edit.isPending ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </CommentDialog>
      ) : null}
      {mode === "delete" ? (
        <CommentDialog title="Delete post?" destructive onClose={() => setMode(null)}>
          <p>
            This post, its comments, and its place in other feeds will be removed. This cannot be
            undone.
          </p>
          {remove.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(remove.error, "The post could not be deleted.")}
            </p>
          ) : null}
          <footer>
            <button type="button" onClick={() => setMode(null)}>
              Keep post
            </button>
            <button
              type="button"
              className="is-danger"
              disabled={remove.isPending}
              onClick={destroy}
            >
              {remove.isPending ? "Deleting…" : "Delete post"}
            </button>
          </footer>
        </CommentDialog>
      ) : null}
      {mode === "report" ? (
        <CommentDialog title="Report post" onClose={() => setMode(null)}>
          <div className="report-form">
            <label>
              Reason
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportKind)}
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Details
              <textarea
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain what is wrong with this post"
              />
            </label>
            <small>{reason.length} / 500 · Minimum 10 characters</small>
          </div>
          {report.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(report.error, "The report could not be submitted.")}
            </p>
          ) : null}
          <footer>
            <button type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="is-primary"
              disabled={reason.trim().length < 10 || report.isPending}
              onClick={submitReport}
            >
              {report.isPending ? "Submitting…" : "Submit report"}
            </button>
          </footer>
        </CommentDialog>
      ) : null}
    </div>
  );
}
