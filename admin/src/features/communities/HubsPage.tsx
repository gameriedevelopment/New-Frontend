import { useEffect, useState } from "react";
import { DirectoryView } from "../../components/DirectoryView";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { ModerationDialog } from "../../components/ModerationDialog";
import { getErrorMessage } from "../../lib/errors";
import { useAdminHubs, useSetAdminHubBan } from "./hooks";
import type { AdminHubRecord } from "./types";

export function HubsPage() {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [type, setType] = useState<AdminHubRecord["type"] | "">("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminHubRecord | null>(null);
  const [selected, setSelected] = useState<AdminHubRecord | null>(null);
  const query = useAdminHubs({
    page,
    limit: 20,
    search: term || undefined,
    type: type || undefined,
  });
  const moderation = useSetAdminHubBan();

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
        title="Hubs"
        description="Review network spaces and apply recorded moderation decisions while preserving community ownership boundaries."
        search={search}
        searchPlaceholder="Search hubs"
        onSearch={setSearch}
        filters={
          <select
            aria-label="Hub type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as AdminHubRecord["type"] | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="community">Community</option>
            <option value="organization">Organization</option>
          </select>
        }
        loading={query.isLoading}
        error={
          query.isError ? getErrorMessage(query.error, "Hubs could not be loaded.") : undefined
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
                <span>
                  {record.visibility} · {record.region || record.country || "Region not set"}
                </span>
              </div>
            </div>
            <div className="admin-directory-meta">
              <span>Hub context</span>
              <strong>
                {record.type} · {record.membersCount ?? 0} members · {record.teamsCount ?? 0} teams
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
        eyebrow="Hub record"
        title={selected?.name ?? "Hub details"}
        subtitle={selected?.description ?? undefined}
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
              {selected.isBanned ? "Restore hub" : "Restrict hub"}
            </button>
          ) : null
        }
      >
        {selected ? (
          <DetailList
            items={[
              { label: "State", value: selected.isBanned ? "Restricted" : "Active" },
              { label: "Type", value: selected.type },
              { label: "Visibility", value: selected.visibility },
              { label: "Join policy", value: selected.joinPolicy },
              { label: "Region", value: selected.region || selected.country },
              { label: "Timezone", value: selected.timezone },
              { label: "Members", value: selected.membersCount ?? 0 },
              { label: "Teams", value: selected.teamsCount ?? 0 },
              { label: "Followers", value: selected.followersCount ?? 0 },
              { label: "Reports", value: selected.reportCount },
              { label: "Owner ID", value: selected.ownerId },
              { label: "Created", value: new Date(selected.createdAt).toLocaleDateString() },
            ]}
          />
        ) : null}
      </DetailDrawer>
      <ModerationDialog
        open={Boolean(target)}
        targetName={target?.name ?? "this hub"}
        action={target?.isBanned ? "restore" : "restrict"}
        busy={moderation.isPending}
        error={
          moderation.isError
            ? getErrorMessage(moderation.error, "The hub state could not be changed.")
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
