import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { getErrorMessage } from "../../lib/errors";
import { readablePostText } from "../../lib/postContent";
import {
  useFlaggedComments,
  useFlaggedPosts,
  useModerationReports,
  useRemoveFlaggedContent,
  useReportAudit,
  useReviewReport,
} from "./hooks";
import { ReviewReportDialog } from "./ReviewReportDialog";
import { RemoveContentDialog } from "./RemoveContentDialog";
import { ReportPostPreview } from "./ReportPostPreview";
import type {
  FlaggedComment,
  FlaggedPost,
  ModerationReport,
  ModerationRemovalReceipt,
  ReportKind,
  ReportStatus,
} from "./types";
import "./moderation.css";

type ModerationTab = "reports" | "posts" | "comments";
type SelectedContent =
  | { kind: "report"; value: ModerationReport }
  | { kind: "post"; value: FlaggedPost }
  | { kind: "comment"; value: FlaggedComment };

const tabs: Array<{ id: ModerationTab; label: string }> = [
  { id: "reports", label: "Reports" },
  { id: "posts", label: "Flagged posts" },
  { id: "comments", label: "Flagged comments" },
];

function excerpt(value?: string, length = 132) {
  if (!value) return "Content is no longer available.";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}

function readable(value: string) {
  return value.replace(/-/g, " ").replace(/^./, (character: string) => character.toUpperCase());
}

export function ModerationPage() {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("view");
  const tab: ModerationTab = rawTab === "posts" || rawTab === "comments" ? rawTab : "reports";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = (params.get("status") || "") as ReportStatus | "";
  const contentType = params.get("contentType") || "";
  const kind = (params.get("type") || "") as ReportKind | "";
  const [search, setSearch] = useState(params.get("search") || "");
  const [term, setTerm] = useState(search.trim());
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [outcome, setOutcome] = useState<Exclude<ReportStatus, "pending"> | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ kind: "post" | "comment"; id: string } | null>(
    null,
  );
  const [receipt, setReceipt] = useState<ModerationRemovalReceipt | null>(null);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = search.trim();
      setTerm(next);
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next) updated.set("search", next);
          else updated.delete("search");
          updated.delete("page");
          return updated;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, setParams]);

  const reports = useModerationReports(
    {
      page,
      perPage: 20,
      search: term || undefined,
      status: status || undefined,
      type: kind || undefined,
      contentType: contentType || undefined,
    },
    tab === "reports",
  );
  const posts = useFlaggedPosts(page, tab === "posts");
  const comments = useFlaggedComments(page, tab === "comments");
  const review = useReviewReport();
  const removal = useRemoveFlaggedContent();
  const selectedReport = selected?.kind === "report" ? selected.value : undefined;
  const audit = useReportAudit(selectedReport?.id);

  const activeQuery = tab === "reports" ? reports : tab === "posts" ? posts : comments;
  const records = useMemo(() => activeQuery.data?.data ?? [], [activeQuery.data]);
  const totalPages = activeQuery.data?.totalPages ?? 0;

  const updateParam = (key: string, value: string) => {
    setParams((current) => {
      const updated = new URLSearchParams(current);
      if (value) updated.set(key, value);
      else updated.delete(key);
      if (key !== "page") updated.delete("page");
      return updated;
    });
  };
  const changeTab = (next: ModerationTab) => {
    setSelected(null);
    setSearch("");
    setTerm("");
    setParams(next === "reports" ? {} : { view: next });
  };

  return (
    <>
      <main className="admin-moderation-page">
        <header className="admin-directory-heading">
          <h1>Moderation</h1>
          <p>
            Review community reports with context, record a clear decision, and preserve the history
            behind every action.
          </p>
        </header>

        {receipt ? (
          <p className="moderation-receipt" role="status">
            {receipt.message} Audit reference: <strong>{receipt.auditId}</strong>
          </p>
        ) : null}

        <nav className="moderation-tabs" aria-label="Moderation views">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={tab === item.id || undefined}
              onClick={() => changeTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "reports" ? (
          <section className="moderation-toolbar" aria-label="Report filters">
            <label className="moderation-search">
              <span className="sr-only">Search report reasons</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search report reasons"
              />
            </label>
            <select
              aria-label="Report status"
              value={status}
              onChange={(event) => updateParam("status", event.target.value)}
            >
              <option value="">All states</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              aria-label="Report type"
              value={kind}
              onChange={(event) => updateParam("type", event.target.value)}
            >
              <option value="">All reasons</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="other">Other</option>
            </select>
            <select
              aria-label="Content type"
              value={contentType}
              onChange={(event) => updateParam("contentType", event.target.value)}
            >
              <option value="">All content</option>
              <option value="post">Posts</option>
              <option value="team-post">Team posts</option>
              <option value="hub-post">Hub posts</option>
              <option value="comment">Comments</option>
              <option value="user">Users</option>
              <option value="team">Teams</option>
              <option value="hub">Hubs</option>
              <option value="match">Matches</option>
            </select>
          </section>
        ) : (
          <p className="moderation-guidance">
            These queues surface repeated flags. Open an item for context; final decisions remain
            report-led and auditable.
          </p>
        )}

        <div className="admin-directory-context">
          <span>
            {activeQuery.isLoading ? "Loading…" : `${activeQuery.data?.total ?? 0} records`}
          </span>
          <span>Page {Math.min(page, Math.max(totalPages, 1))}</span>
        </div>

        {activeQuery.isError ? (
          <section className="admin-directory-state" role="alert">
            <h2>Moderation queue unavailable</h2>
            <p>{getErrorMessage(activeQuery.error, "The moderation queue could not be loaded.")}</p>
            <button className="admin-secondary-button" onClick={() => void activeQuery.refetch()}>
              Try again
            </button>
          </section>
        ) : activeQuery.isLoading ? (
          <section className="admin-directory-list" aria-label="Moderation queue loading" aria-busy>
            {Array.from({ length: 7 }, (_, index) => (
              <div className="admin-directory-skeleton" key={index} />
            ))}
          </section>
        ) : !records.length ? (
          <section className="admin-directory-state">
            <h2>The queue is clear</h2>
            <p>No records match this moderation view and its current filters.</p>
          </section>
        ) : (
          <section className="moderation-list">
            {tab === "reports"
              ? (records as ModerationReport[]).map((report) => (
                  <button
                    type="button"
                    className="moderation-row"
                    key={report.id}
                    onClick={() => setSelected({ kind: "report", value: report })}
                  >
                    <span className="moderation-row__primary">
                      <strong>{readable(report.type)}</strong>
                      <small>{excerpt(report.reason)}</small>
                    </span>
                    <span className="moderation-row__meta">
                      <small>{readable(report.contentType)}</small>
                      <time>{new Date(report.createdAt).toLocaleDateString()}</time>
                    </span>
                    <span className={`admin-record-state moderation-state is-${report.status}`}>
                      {readable(report.status)}
                    </span>
                  </button>
                ))
              : (records as Array<FlaggedPost | FlaggedComment>).map((record) => (
                  <button
                    type="button"
                    className="moderation-row"
                    key={record.id}
                    onClick={() =>
                      setSelected({
                        kind: tab === "posts" ? "post" : "comment",
                        value: record,
                      } as SelectedContent)
                    }
                  >
                    <span className="moderation-row__primary">
                      <strong>{record.authorName || "Unknown author"}</strong>
                      <small>{excerpt(readablePostText(record.content))}</small>
                    </span>
                    <span className="moderation-row__meta">
                      <small>{record.reportCount} reports</small>
                      <time>
                        {new Date(record.lastReportedAt || record.createdAt).toLocaleDateString()}
                      </time>
                    </span>
                    <span className="admin-record-state">Review context</span>
                  </button>
                ))}
          </section>
        )}

        {!activeQuery.isError && !activeQuery.isLoading && totalPages > 1 ? (
          <nav className="admin-directory-pagination" aria-label="Moderation pages">
            <button
              className="admin-secondary-button"
              disabled={page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
            >
              Previous
            </button>
            <span>
              {page} of {totalPages}
            </span>
            <button
              className="admin-secondary-button"
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
            >
              Next
            </button>
          </nav>
        ) : null}
      </main>

      <DetailDrawer
        open={Boolean(selected)}
        eyebrow={selected?.kind === "report" ? "Report review" : "Flagged content"}
        title={
          selected?.kind === "report"
            ? readable(selected.value.type)
            : selected?.kind === "post"
              ? "Flagged post"
              : "Flagged comment"
        }
        subtitle={selected ? `Record ${selected.value.id}` : undefined}
        onClose={() => setSelected(null)}
        actions={
          selected?.kind === "report" ? (
            <>
              {["post", "team-post", "hub-post"].includes(selected.value.contentType) ? (
                <button
                  className="admin-secondary-button"
                  onClick={() => setPreviewReportId(selected.value.id)}
                >
                  View post
                </button>
              ) : null}
              {selectedReport?.status === "pending" ? (
                <>
                  <button
                    className="admin-secondary-button"
                    onClick={() => setOutcome("dismissed")}
                  >
                    Dismiss
                  </button>
                  <button className="admin-primary-button" onClick={() => setOutcome("resolved")}>
                    Resolve
                  </button>
                </>
              ) : null}
            </>
          ) : selected?.kind === "post" || selected?.kind === "comment" ? (
            <button
              className="admin-danger-button"
              onClick={() => {
                removal.reset();
                setRemoveTarget({ kind: selected.kind, id: selected.value.id });
              }}
            >
              Remove {selected.kind}
            </button>
          ) : null
        }
      >
        {selected?.kind === "report" ? (
          <>
            <DetailList
              items={[
                { label: "State", value: readable(selected.value.status) },
                { label: "Content", value: readable(selected.value.contentType) },
                { label: "Reason", value: selected.value.reason },
                { label: "Reported item", value: selected.value.contentId },
                { label: "Content author", value: selected.value.contentAuthorId },
                { label: "Reporter", value: selected.value.reporterId },
                { label: "Submitted", value: new Date(selected.value.createdAt).toLocaleString() },
                { label: "Moderator notes", value: selected.value.moderatorNotes },
              ]}
            />
            <section className="report-context">
              <span className="admin-eyebrow">Reported content</span>
              <p>{excerpt(readablePostText(selected.value.entity?.content), 500)}</p>
              {["post", "team-post", "hub-post"].includes(selected.value.contentType) ? (
                <button
                  type="button"
                  className="admin-secondary-button report-context__view"
                  onClick={() => setPreviewReportId(selected.value.id)}
                >
                  View full post
                </button>
              ) : null}
            </section>
            <section className="report-audit">
              <span className="admin-eyebrow">Audit history</span>
              {audit.isLoading ? (
                <div className="report-audit__loading" />
              ) : audit.isError ? (
                <p>Audit history could not be loaded.</p>
              ) : (
                <ol>
                  {audit.data?.map((entry) => (
                    <li key={entry.id}>
                      <span>{readable(entry.action)}</span>
                      <time>{new Date(entry.createdAt).toLocaleString()}</time>
                      {entry.metadata?.moderatorNotes ? (
                        <p>{entry.metadata.moderatorNotes}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : selected ? (
          <>
            <DetailList
              items={[
                { label: "Author", value: selected.value.authorName },
                { label: "Reports", value: selected.value.reportCount },
                { label: "Created", value: new Date(selected.value.createdAt).toLocaleString() },
                {
                  label: "Last reported",
                  value: selected.value.lastReportedAt
                    ? new Date(selected.value.lastReportedAt).toLocaleString()
                    : null,
                },
              ]}
            />
            <section className="report-context">
              <span className="admin-eyebrow">Content snapshot</span>
              <p>{readablePostText(selected.value.content)}</p>
            </section>
            <p className="moderation-safety-note">
              Removal is permanent. The confirmation requires an operational reason and returns a
              traceable audit reference.
            </p>
          </>
        ) : null}
      </DetailDrawer>

      <ReviewReportDialog
        report={selectedReport ?? null}
        outcome={outcome}
        busy={review.isPending}
        error={
          review.isError
            ? getErrorMessage(review.error, "The decision could not be recorded.")
            : undefined
        }
        onClose={() => {
          if (!review.isPending) setOutcome(null);
        }}
        onConfirm={(notes) => {
          if (!selectedReport || !outcome) return;
          review.mutate(
            { id: selectedReport.id, status: outcome, notes },
            {
              onSuccess: (updated) => {
                setSelected({ kind: "report", value: updated });
                setOutcome(null);
              },
            },
          );
        }}
      />

      <RemoveContentDialog
        kind={removeTarget?.kind ?? null}
        busy={removal.isPending}
        error={
          removal.isError
            ? getErrorMessage(removal.error, "The content could not be removed.")
            : undefined
        }
        onClose={() => {
          if (!removal.isPending) setRemoveTarget(null);
        }}
        onConfirm={(reason) => {
          if (!removeTarget) return;
          removal.mutate(
            { ...removeTarget, reason },
            {
              onSuccess: (nextReceipt) => {
                setReceipt(nextReceipt);
                setRemoveTarget(null);
                setSelected(null);
              },
            },
          );
        }}
      />
      {previewReportId ? (
        <ReportPostPreview reportId={previewReportId} onClose={() => setPreviewReportId(null)} />
      ) : null}
    </>
  );
}
