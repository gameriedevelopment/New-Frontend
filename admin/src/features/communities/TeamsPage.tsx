import { useEffect, useState } from "react";
import { DirectoryView } from "../../components/DirectoryView";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { ModerationDialog } from "../../components/ModerationDialog";
import { getErrorMessage } from "../../lib/errors";
import { useAdminTeams, useSetAdminTeamBan } from "./hooks";
import type { AdminTeamRecord } from "./types";

const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"];

export function TeamsPage() {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminTeamRecord | null>(null);
  const [selected, setSelected] = useState<AdminTeamRecord | null>(null);
  const query = useAdminTeams({
    page,
    limit: 20,
    search: term || undefined,
    level: level || undefined,
  });
  const moderation = useSetAdminTeamBan();

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
        eyebrow="Communities"
        title="Teams"
        description="Review roster identities and make accountable access decisions without entering day-to-day team management."
        search={search}
        searchPlaceholder="Search teams"
        onSearch={setSearch}
        filters={
          <select
            aria-label="Team level"
            value={level}
            onChange={(event) => {
              setLevel(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All levels</option>
            {levels.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        }
        loading={query.isLoading}
        error={
          query.isError ? getErrorMessage(query.error, "Teams could not be loaded.") : undefined
        }
        empty={!query.isLoading && !query.data?.data.length}
        count={query.data?.total}
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        onPage={setPage}
        onRetry={() => void query.refetch()}
      >
        {query.data?.data.map((record) => (
          <article
            className="admin-directory-row"
            key={record.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelected(record);
              }
            }}
          >
            <div className="admin-directory-identity">
              <span className="admin-directory-avatar admin-directory-avatar--rounded">
                {record.name.slice(0, 2).toUpperCase()}
                {record.logo ? (
                  <img
                    src={record.logo}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
              </span>
              <div>
                <strong>{record.name}</strong>
                <span>{record.region || record.country || "Region not set"}</span>
              </div>
            </div>
            <div className="admin-directory-meta">
              <span>Team context</span>
              <strong>
                {record.level || "Level not set"} · {record.membersCount ?? 0} members
              </strong>
            </div>
            <span
              className={
                record.isBanned ? "admin-record-state is-restricted" : "admin-record-state"
              }
            >
              {record.isBanned ? "Restricted" : "Active"}
            </span>
            <button
              className="admin-row-action"
              onClick={(event) => {
                event.stopPropagation();
                moderation.reset();
                setTarget(record);
              }}
            >
              {record.isBanned ? "Restore" : "Restrict"}
            </button>
          </article>
        ))}
      </DirectoryView>
      <DetailDrawer
        open={Boolean(selected)}
        eyebrow="Team record"
        title={selected?.name ?? "Team details"}
        subtitle={selected?.description}
        onClose={() => setSelected(null)}
        actions={
          selected ? (
            <button
              className="admin-row-action"
              onClick={() => {
                moderation.reset();
                setTarget(selected);
              }}
            >
              {selected.isBanned ? "Restore team" : "Restrict team"}
            </button>
          ) : null
        }
      >
        {selected ? (
          <DetailList
            items={[
              { label: "State", value: selected.isBanned ? "Restricted" : "Active" },
              { label: "Level", value: selected.level },
              { label: "Region", value: selected.region || selected.country },
              { label: "Timezone", value: selected.timezone },
              { label: "Members", value: selected.membersCount ?? 0 },
              { label: "Platforms", value: selected.platforms?.join(", ") },
              { label: "Reports", value: selected.reportCount },
              { label: "Owner ID", value: selected.ownerId },
              { label: "Created", value: new Date(selected.createdAt).toLocaleDateString() },
            ]}
          />
        ) : null}
      </DetailDrawer>
      <ModerationDialog
        open={Boolean(target)}
        targetName={target?.name ?? "this team"}
        action={target?.isBanned ? "restore" : "restrict"}
        busy={moderation.isPending}
        error={
          moderation.isError
            ? getErrorMessage(moderation.error, "The team state could not be changed.")
            : undefined
        }
        onClose={() => {
          if (!moderation.isPending) setTarget(null);
        }}
        onConfirm={(reason) => {
          if (!target) return;
          moderation.mutate(
            { id: target.id, ban: !target.isBanned, reason },
            {
              onSuccess: () => {
                setTarget(null);
                setSelected(null);
              },
            },
          );
        }}
      />
    </>
  );
}
