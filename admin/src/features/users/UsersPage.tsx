import { useEffect, useState } from "react";
import { DirectoryView } from "../../components/DirectoryView";
import { ModerationDialog } from "../../components/ModerationDialog";
import { getErrorMessage } from "../../lib/errors";
import { useAdminAuth } from "../auth/AuthProvider";
import { useAdminUsers, useSetAdminUserBan } from "./hooks";
import type { AdminUserRecord, AdminUserStatus } from "./types";

export function UsersPage() {
  const { user } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<AdminUserStatus | "">("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUserRecord | null>(null);
  const query = useAdminUsers({
    page,
    limit: 20,
    search: term || undefined,
    status: status || undefined,
  });
  const moderation = useSetAdminUserBan();

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
        eyebrow="People"
        title="Users"
        description="Review account state and apply traceable access decisions without exposing private profile data."
        search={search}
        searchPlaceholder="Search username or email"
        onSearch={setSearch}
        filters={
          <select
            aria-label="Account state"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminUserStatus | "");
              setPage(1);
            }}
          >
            <option value="">All states</option>
            <option value="active">Active</option>
            <option value="banned">Restricted</option>
          </select>
        }
        loading={query.isLoading}
        error={
          query.isError ? getErrorMessage(query.error, "Users could not be loaded.") : undefined
        }
        empty={!query.isLoading && !query.data?.data.length}
        count={query.data?.total}
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        onPage={setPage}
        onRetry={() => void query.refetch()}
      >
        {query.data?.data.map((record) => (
          <article className="admin-directory-row" key={record.id}>
            <div className="admin-directory-identity">
              <span className="admin-directory-avatar">
                {record.username.slice(0, 2).toUpperCase()}
                {record.profileImage ? (
                  <img
                    src={record.profileImage}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
              </span>
              <div>
                <strong>{record.username}</strong>
                <span>{record.email}</span>
              </div>
            </div>
            <div className="admin-directory-meta">
              <span>Role</span>
              <strong>{record.role}</strong>
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
              disabled={record.id === user?.id}
              onClick={() => {
                moderation.reset();
                setTarget(record);
              }}
            >
              {record.isBanned ? "Restore" : "Restrict"}
            </button>
          </article>
        ))}
      </DirectoryView>
      <ModerationDialog
        open={Boolean(target)}
        targetName={target?.username ?? "this account"}
        action={target?.isBanned ? "restore" : "restrict"}
        busy={moderation.isPending}
        error={
          moderation.isError
            ? getErrorMessage(moderation.error, "The account state could not be changed.")
            : undefined
        }
        onClose={() => {
          if (!moderation.isPending) setTarget(null);
        }}
        onConfirm={(reason) => {
          if (!target) return;
          moderation.mutate(
            { id: target.id, ban: !target.isBanned, reason },
            { onSuccess: () => setTarget(null) },
          );
        }}
      />
    </>
  );
}
