import { Heart, MessageSquare, X } from "lucide-react";
import { useEffect, useId } from "react";
import { AdminAvatar } from "../../components/AdminAvatar";
import { getErrorMessage } from "../../lib/errors";
import { readablePostText } from "../../lib/postContent";
import { useReportContext } from "./hooks";
import type { ReportKind } from "./types";
import "./report-preview.css";

const READABLE_KIND: Record<ReportKind, string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate",
  other: "Other",
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function ReportPostPreview({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const query = useReportContext(reportId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const context = query.data;
  const post = context?.post;

  return (
    <div
      className="admin-dialog report-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="report-preview__panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="report-preview__header">
          <div>
            <span className="admin-eyebrow">Reported content</span>
            <h2 id={titleId}>Post preview</h2>
          </div>
          <button
            type="button"
            className="report-preview__close"
            aria-label="Close post preview"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </header>

        {context ? (
          <div className="report-preview__reason">
            <div>
              <span>Report reason</span>
              <strong>
                {READABLE_KIND[context.report.type]} — {context.report.reason}
              </strong>
            </div>
            <div>
              <span>Reported by</span>
              <strong>{context.report.reporter.username ?? context.report.reporter.id}</strong>
            </div>
          </div>
        ) : null}

        <div className="report-preview__body">
          {query.isLoading ? (
            <p className="report-preview__state">Loading post…</p>
          ) : query.isError ? (
            <p className="report-preview__state" role="alert">
              {getErrorMessage(query.error, "The post could not be loaded.")}
            </p>
          ) : !post ? (
            <p className="report-preview__state">
              This report is not for a post, or the post has been removed.
            </p>
          ) : (
            <article className="report-preview__post">
              <header>
                <AdminAvatar name={post.authorName} src={post.authorImage} />
                <div>
                  <strong>{post.authorName || "Unknown author"}</strong>
                  <small>{formatDate(post.createdAt)}</small>
                </div>
              </header>
              {post.content ? (
                <p className="report-preview__content">{readablePostText(post.content)}</p>
              ) : null}
              {post.media.length ? (
                <div className="report-preview__media" data-count={Math.min(post.media.length, 3)}>
                  {post.media.map((src, index) => (
                    <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt={`Reported media ${index + 1}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="report-preview__engagement">
                <span>
                  <Heart size={14} /> {post.likeCount}
                </span>
                <span>
                  <MessageSquare size={14} /> {post.commentCount}
                </span>
              </div>

              <section className="report-preview__comments">
                <h3>Comments ({post.commentCount})</h3>
                {post.comments.length ? (
                  <ul>
                    {post.comments.map((comment) => (
                      <li key={comment.id}>
                        <AdminAvatar name={comment.authorName} src={comment.authorImage} />
                        <div>
                          <div className="report-preview__comment-head">
                            <strong>{comment.authorName || "Unknown"}</strong>
                            <small>{formatDate(comment.createdAt)}</small>
                          </div>
                          <p>{readablePostText(comment.content)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="report-preview__state">No comments on this post.</p>
                )}
              </section>
            </article>
          )}
        </div>

        <footer className="report-preview__footer">
          <button type="button" className="admin-primary-button" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
