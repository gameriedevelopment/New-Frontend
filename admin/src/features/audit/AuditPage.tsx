import { useEffect, useState } from "react";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { DirectoryView } from "../../components/DirectoryView";
import { getErrorMessage } from "../../lib/errors";
import { useAuditHistory } from "./hooks";
import type { AdminAuditRecord } from "./types";
import "./audit.css";

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function AuditPage() {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminAuditRecord | null>(null);
  const query = useAuditHistory({
    page,
    limit: 25,
    search: term || undefined,
    targetType: targetType || undefined,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <>
      <DirectoryView
        eyebrow="Accountability"
        title="Audit history"
        description="A permanent, chronological record of sensitive administrator decisions across Gamerie."
        search={search}
        searchPlaceholder="Search action, reason, target, or administrator"
        onSearch={setSearch}
        filters={
          <select
            aria-label="Target type"
            value={targetType}
            onChange={(event) => {
              setTargetType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All targets</option>
            <option value="user">Players</option>
            <option value="team">Teams</option>
            <option value="hub">Hubs</option>
            <option value="challenge">Challenges</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="game">Games</option>
            <option value="tournament">Tournaments</option>
            <option value="achievement">Achievements</option>
            <option value="referral_code">Referral codes</option>
            <option value="admin_member">Administrators</option>
            <option value="admin_invite">Admin invitations</option>
          </select>
        }
        loading={query.isLoading}
        error={
          query.isError
            ? getErrorMessage(query.error, "Audit history could not be loaded.")
            : undefined
        }
        empty={!query.isLoading && !query.data?.data.length}
        count={query.data?.total}
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        onPage={setPage}
        onRetry={() => void query.refetch()}
      >
        {query.data?.data.map((record) => (
          <AuditRow key={record.id} record={record} onSelect={setSelected} />
        ))}
      </DirectoryView>
      <DetailDrawer
        open={Boolean(selected)}
        eyebrow="Audit event"
        title={selected ? humanize(selected.action) : "Audit details"}
        subtitle={selected?.reason}
        onClose={() => setSelected(null)}
      >
        {selected ? <AuditDetails record={selected} /> : null}
      </DetailDrawer>
    </>
  );
}

function AuditRow({
  record,
  onSelect,
}: {
  record: AdminAuditRecord;
  onSelect: (record: AdminAuditRecord) => void;
}) {
  return (
    <div
      className="admin-directory-row audit-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(record);
        }
      }}
    >
      <div className="admin-directory-meta">
        <strong>{humanize(record.action)}</strong>
        <span>{record.actor}</span>
      </div>
      <div className="admin-directory-meta">
        <strong>{humanize(record.targetType)}</strong>
        <span>{record.targetId.slice(0, 8)}</span>
      </div>
      <div className="admin-directory-meta">
        <strong>{dateTime.format(new Date(record.createdAt))}</strong>
        <span>{record.reason}</span>
      </div>
      <button
        className="admin-row-action"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(record);
        }}
      >
        Review
      </button>
    </div>
  );
}

function AuditDetails({ record }: { record: AdminAuditRecord }) {
  return (
    <div className="audit-details">
      <DetailList
        items={[
          { label: "Administrator", value: record.actor },
          { label: "Action", value: humanize(record.action) },
          { label: "Target", value: `${humanize(record.targetType)} · ${record.targetId}` },
          { label: "Recorded", value: dateTime.format(new Date(record.createdAt)) },
          { label: "Request ID", value: record.requestId || "Not supplied" },
          { label: "Network", value: record.ipAddress || "Not supplied" },
        ]}
      />
      <section>
        <span className="admin-eyebrow">Reason</span>
        <p>{record.reason}</p>
      </section>
      {record.before ? <Snapshot label="Before" value={record.before} /> : null}
      {record.after ? <Snapshot label="After" value={record.after} /> : null}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: Record<string, unknown> }) {
  return (
    <section>
      <span className="admin-eyebrow">{label}</span>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}
function humanize(value: string) {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
