import { useMemo, useState } from "react";
import { StatePanel } from "../../components/Feedback";
import { getErrorMessage } from "../../lib/errors";
import { useAnnouncements, useBrevoResync, usePublishAnnouncement } from "./hooks";
import type { BrevoRunReceipt } from "./types";
import "./communications.css";

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function CommunicationsPage() {
  const announcements = useAnnouncements();
  const publish = usePublishAnnouncement();
  const brevo = useBrevoResync();
  const [content, setContent] = useState("");
  const [publishReason, setPublishReason] = useState("");
  const [brevoReason, setBrevoReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [dryRunReceipt, setDryRunReceipt] = useState<BrevoRunReceipt | null>(null);
  const [receipt, setReceipt] = useState<BrevoRunReceipt | null>(null);
  const posts = useMemo(
    () => announcements.data?.pages.flatMap((page) => page.posts) ?? [],
    [announcements.data],
  );

  async function submitAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    await publish.mutateAsync({ content: content.trim(), reason: publishReason.trim() });
    setContent("");
    setPublishReason("");
  }

  async function run(dryRun: boolean) {
    const result = await brevo.mutateAsync({
      dryRun,
      reason: brevoReason.trim(),
      confirmation: dryRun ? undefined : confirmation,
    });
    setReceipt(result);
    if (dryRun) setDryRunReceipt(result);
    else {
      setDryRunReceipt(null);
      setConfirmation("");
      setBrevoReason("");
    }
  }

  return (
    <main className="communications-page">
      <header className="admin-page-heading">
        <div>
          <h1>Communications</h1>
          <p>Publish official updates and run controlled audience synchronization.</p>
        </div>
      </header>

      <div className="communications-grid">
        <section className="communications-panel" aria-labelledby="announcement-heading">
          <header>
            <div>
              <span className="admin-eyebrow">Official feed</span>
              <h2 id="announcement-heading">Publish an announcement</h2>
            </div>
            <small>Visible in the player feed</small>
          </header>
          <form className="communications-form" onSubmit={submitAnnouncement}>
            <label>
              Announcement
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Write a clear platform update"
                required
              />
              <small>{content.length.toLocaleString()} / 5,000</small>
            </label>
            <label>
              Publication reason
              <input
                value={publishReason}
                onChange={(event) => setPublishReason(event.target.value)}
                maxLength={500}
                placeholder="Why this update is being published"
                required
              />
            </label>
            {publish.isError ? (
              <p className="communications-error">
                {getErrorMessage(publish.error, "The announcement could not be published.")}
              </p>
            ) : null}
            <footer>
              <span>The reason is stored in Audit History.</span>
              <button
                className="admin-primary-button"
                disabled={publish.isPending || !content.trim() || !publishReason.trim()}
              >
                {publish.isPending ? "Publishing…" : "Publish announcement"}
              </button>
            </footer>
          </form>
        </section>

        <section className="communications-panel brevo-runbook" aria-labelledby="brevo-heading">
          <header>
            <div>
              <h2 id="brevo-heading">CRM synchronization</h2>
            </div>
            <small>Dry run required first</small>
          </header>
          <p>
            Adds Gamerie members who are not yet in the CRM email audience (name, username and
            signup date — no email content leaves Gamerie beyond the address itself). Run a dry
            check first to see how many members are pending; the live sync then uploads them to the
            CRM audience. Only counts are shown here or written to the audit record — no email
            addresses are returned to this workspace.
          </p>
          <label>
            Operational reason
            <input
              value={brevoReason}
              onChange={(event) => {
                setBrevoReason(event.target.value);
                setDryRunReceipt(null);
              }}
              maxLength={500}
              placeholder="Why this synchronization is needed"
              required
            />
          </label>
          {dryRunReceipt ? (
            <div className="brevo-review" aria-live="polite">
              <strong>Dry run ready</strong>
              <dl>
                <div>
                  <dt>Pending</dt>
                  <dd>{dryRunReceipt.total.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Valid</dt>
                  <dd>{dryRunReceipt.valid.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Duplicates</dt>
                  <dd>{dryRunReceipt.duplicatesSkipped.toLocaleString()}</dd>
                </div>
              </dl>
              <label>
                Type CONFIRM CRM SYNC to continue
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                />
              </label>
            </div>
          ) : null}
          {brevo.isError ? (
            <p className="communications-error">
              {getErrorMessage(brevo.error, "The synchronization operation failed.")}
            </p>
          ) : null}
          <footer>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={brevo.isPending || !brevoReason.trim()}
              onClick={() => void run(true)}
            >
              {brevo.isPending ? "Running…" : "Run dry check"}
            </button>
            {dryRunReceipt ? (
              <button
                className="admin-primary-button"
                type="button"
                disabled={brevo.isPending || confirmation !== "CONFIRM CRM SYNC"}
                onClick={() => void run(false)}
              >
                Run live sync
              </button>
            ) : null}
          </footer>
          {receipt ? <BrevoReceipt receipt={receipt} /> : null}
        </section>
      </div>

      <section className="announcement-history" aria-labelledby="announcement-history-heading">
        <header>
          <div>
            <span className="admin-eyebrow">Publication history</span>
            <h2 id="announcement-history-heading">Recent announcements</h2>
          </div>
          <small>Newest first</small>
        </header>
        {announcements.isLoading ? (
          <div className="announcement-skeleton" aria-label="Loading announcements" />
        ) : announcements.isError ? (
          <StatePanel title="Announcements are unavailable">
            <p>
              {getErrorMessage(announcements.error, "Publication history could not be loaded.")}
            </p>
            <button className="admin-secondary-button" onClick={() => void announcements.refetch()}>
              Try again
            </button>
          </StatePanel>
        ) : posts.length ? (
          <div className="announcement-list">
            {posts.map((post) => (
              <article key={post.id}>
                <header>
                  <strong>{post.authorName}</strong>
                  <time dateTime={post.createdAt}>{dateTime.format(new Date(post.createdAt))}</time>
                </header>
                <p>{plainText(post.content)}</p>
              </article>
            ))}
            {announcements.hasNextPage ? (
              <button
                className="admin-secondary-button"
                onClick={() => void announcements.fetchNextPage()}
                disabled={announcements.isFetchingNextPage}
              >
                {announcements.isFetchingNextPage ? "Loading…" : "Load older announcements"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="communications-empty">
            <strong>No announcements yet</strong>
            <p>Published platform updates will remain available here.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function BrevoReceipt({ receipt }: { receipt: BrevoRunReceipt }) {
  return (
    <div className="brevo-receipt" aria-live="polite">
      <strong>{receipt.dryRun ? "Dry run recorded" : "Synchronization recorded"}</strong>
      <span>
        {receipt.dryRun
          ? `${receipt.valid.toLocaleString()} valid contacts are eligible.`
          : `${receipt.synced.toLocaleString()} synchronized · ${receipt.failed.toLocaleString()} failed.`}
      </span>
      <small>Audit {receipt.auditId}</small>
    </div>
  );
}

function plainText(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html");
  return document.body.textContent?.trim() || value;
}
