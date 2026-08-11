import {
  ChevronDown,
  ChevronUp,
  Flag,
  Heart,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import type { AuthUser } from "../../auth/types";
import { useCreateReport, useDeleteComment, useEditComment, useToggleCommentLike } from "../hooks";
import type { FeedComment, PostOwnerType } from "../types";
import { CommentDialog } from "./CommentDialog";
import { RichText } from "./RichText";
import { RichPostEditor } from "./RichPostEditor";

function commentIdentity(comment: FeedComment) {
  const author = comment.author ?? comment.user;
  return {
    id: String(author?.id ?? comment.authorId ?? comment.userId ?? ""),
    name: author?.displayName ?? author?.username ?? comment.authorName ?? "Gamerie player",
    username: author?.username ?? comment.authorName,
    image: author?.profilePictureUrl ?? author?.profileImage ?? comment.authorImage,
  };
}

function commentTime(value?: string) {
  if (!value) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7
    ? `${days}d ago`
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
        new Date(value),
      );
}

function isLikedBy(comment: FeedComment, userId?: string) {
  return Boolean(
    userId &&
    comment.likes?.some((like) =>
      typeof like === "string" ? like === userId : like.id === userId,
    ),
  );
}

export function CommentItem({
  comment,
  depth = 0,
  postId,
  type,
  user,
  onReply,
}: {
  comment: FeedComment;
  depth?: number;
  postId: string;
  type: PostOwnerType;
  user: AuthUser;
  onReply: (comment: FeedComment) => void;
}) {
  const author = commentIdentity(comment);
  const replies = comment.replies ?? [];
  const owner = user.id === author.id || user.id === comment.authorId;
  const [showReplies, setShowReplies] = useState(depth > 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "delete" | "report" | null>(null);
  const [editValue, setEditValue] = useState(comment.content);
  const [reportType, setReportType] = useState<"spam" | "harassment" | "inappropriate" | "other">(
    "spam",
  );
  const [reportReason, setReportReason] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const like = useToggleCommentLike(postId, type);
  const edit = useEditComment(postId);
  const remove = useDeleteComment(postId);
  const report = useCreateReport();
  const liked = isLikedBy(comment, user.id);
  const visualLiked = like.isPending && like.variables?.commentId === comment.id ? !liked : liked;
  const likeCount = Number(comment.likesCount ?? comment.likes?.length ?? 0);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  const saveEdit = async () => {
    if (!editValue.trim() || editValue.trim().length > 2000) return;
    try {
      await edit.mutateAsync({ commentId: comment.id, content: editValue.trim() });
      setMode(null);
    } catch {
      /* Error remains in dialog. */
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(comment.id);
      setMode(null);
    } catch {
      /* Error remains in dialog. */
    }
  };
  const submitReport = async () => {
    if (reportReason.trim().length < 10) return;
    try {
      await report.mutateAsync({
        contentId: comment.id,
        contentType: "comment",
        contentAuthorId: author.id,
        reporterId: user.id,
        type: reportType,
        reason: reportReason.trim(),
      });
      setMode(null);
      setReportReason("");
      setReportType("spam");
    } catch {
      /* Error remains in dialog. */
    }
  };

  return (
    <div className="comment-item" data-depth={Math.min(depth, 3)}>
      <div className="comment-item__line">
        <SafeImage src={author.image} alt="" />
        <div className="comment-item__body">
          <header>
            <Link to={author.username ? `/profile/${author.username}` : `/users/${author.id}`}>
              {author.name}
            </Link>
            <time dateTime={comment.createdAt}>{commentTime(comment.createdAt)}</time>
            <div className="comment-item__menu" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Comment options"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={17} />
              </button>
              {menuOpen ? (
                <div role="menu">
                  {owner ? (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setEditValue(comment.content);
                          setMode("edit");
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setMode("delete");
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setMode("report");
                      }}
                    >
                      <Flag size={14} />
                      Report
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </header>
          <RichText className="comment-item__content" content={comment.content} />
          <footer>
            <button
              type="button"
              className={visualLiked ? "is-active" : undefined}
              onClick={() => like.mutate({ commentId: comment.id, liked })}
              disabled={like.isPending}
              aria-pressed={visualLiked}
            >
              <Heart size={14} fill={visualLiked ? "currentColor" : "none"} />
              {likeCount || "Like"}
            </button>
            <button type="button" onClick={() => onReply(comment)}>
              <Reply size={14} />
              Reply
            </button>
            {replies.length ? (
              <button type="button" onClick={() => setShowReplies((visible) => !visible)}>
                {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showReplies
                  ? "Hide replies"
                  : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
              </button>
            ) : null}
          </footer>
        </div>
      </div>
      {showReplies && replies.length ? (
        <div className="comment-item__replies">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              type={type}
              user={user}
              onReply={onReply}
            />
          ))}
        </div>
      ) : null}
      {mode === "edit" ? (
        <CommentDialog title="Edit comment" onClose={() => setMode(null)}>
          <RichPostEditor
            compact
            expanded
            value={editValue}
            onChange={setEditValue}
            onSubmit={saveEdit}
            placeholder="Update your comment…"
          />
          <p className="comment-dialog__count">{editValue.length} / 2000</p>
          {edit.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(edit.error, "The comment could not be updated.")}
            </p>
          ) : null}
          <footer>
            <button type="button" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="is-primary"
              disabled={!editValue.trim() || editValue.length > 2000 || edit.isPending}
              onClick={saveEdit}
            >
              {edit.isPending ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </CommentDialog>
      ) : null}
      {mode === "delete" ? (
        <CommentDialog title="Delete comment?" destructive onClose={() => setMode(null)}>
          <p>This comment and its conversation context will be removed. This cannot be undone.</p>
          {remove.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(remove.error, "The comment could not be deleted.")}
            </p>
          ) : null}
          <footer>
            <button type="button" onClick={() => setMode(null)}>
              Keep comment
            </button>
            <button
              type="button"
              className="is-danger"
              disabled={remove.isPending}
              onClick={confirmDelete}
            >
              {remove.isPending ? "Deleting…" : "Delete comment"}
            </button>
          </footer>
        </CommentDialog>
      ) : null}
      {mode === "report" ? (
        <CommentDialog title="Report comment" onClose={() => setMode(null)}>
          <div className="report-form">
            <label>
              Reason
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as typeof reportType)}
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
                value={reportReason}
                maxLength={500}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Explain what is wrong with this comment"
              />
            </label>
            <small>{reportReason.length} / 500 · Minimum 10 characters</small>
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
              disabled={reportReason.trim().length < 10 || report.isPending}
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
