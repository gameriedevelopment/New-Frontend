import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { getErrorMessage } from "../../lib/errors";
import { useAdminAuth } from "../auth/AuthProvider";
import {
  useInvitePlatformAdmin,
  usePlatformAdminInvites,
  usePlatformAdmins,
  useRemovePlatformAdmin,
  useResendPlatformAdminInvite,
  useRevokePlatformAdminInvite,
  useUpdatePlatformAdmin,
} from "./hooks";
import { OperatorDialog } from "./OperatorDialog";
import type { PlatformAdminInvite, PlatformAdminMember } from "./types";
import "./operators.css";

type MemberAction = { kind: "status" | "remove"; member: PlatformAdminMember } | null;
type InviteAction = { kind: "resend" | "revoke"; invite: PlatformAdminInvite } | null;

export function AdminsPage() {
  const { user } = useAdminAuth();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "invites" ? "invites" : "members";
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PlatformAdminMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [memberAction, setMemberAction] = useState<MemberAction>(null);
  const [inviteAction, setInviteAction] = useState<InviteAction>(null);
  const canManage = Boolean(user?.isSuperAdmin);
  const members = usePlatformAdmins(
    { page, limit: 20, search: term || undefined },
    canManage && view === "members",
  );
  const invites = usePlatformAdminInvites(
    { page, limit: 20, search: term || undefined },
    canManage && view === "invites",
  );
  const invite = useInvitePlatformAdmin();
  const update = useUpdatePlatformAdmin();
  const remove = useRemovePlatformAdmin();
  const resend = useResendPlatformAdminInvite();
  const revoke = useRevokePlatformAdminInvite();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;
  const current = view === "members" ? members : invites;
  const actionMutation = memberAction?.kind === "remove" ? remove : update;
  const inviteMutation = inviteAction?.kind === "resend" ? resend : revoke;

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    invite.mutate(inviteEmail.trim(), {
      onSuccess: () => {
        setInviteEmail("");
        setInviteOpen(false);
        setParams({ view: "invites" });
      },
    });
  };

  return (
    <main className="admin-operators-page">
      <header className="admin-operators-heading">
        <div>
          <span className="admin-eyebrow">Access governance</span>
          <h1>Administrators</h1>
          <p>
            Invite trusted operators and review their access without mixing platform permissions
            with CRM roles.
          </p>
        </div>
        <button
          className="admin-primary-button"
          onClick={() => {
            invite.reset();
            setInviteOpen(true);
          }}
        >
          Invite administrator
        </button>
      </header>
      <div className="admin-operators-tabs" role="tablist" aria-label="Administrator records">
        <button
          role="tab"
          aria-selected={view === "members"}
          onClick={() => {
            setParams({ view: "members" });
            setPage(1);
          }}
        >
          Active access
        </button>
        <button
          role="tab"
          aria-selected={view === "invites"}
          onClick={() => {
            setParams({ view: "invites" });
            setPage(1);
          }}
        >
          Invitations
        </button>
      </div>
      <div className="admin-operators-search">
        <input
          aria-label="Search administrator records"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email"
        />
      </div>

      {current.isLoading ? (
        <div className="admin-operator-loading" aria-label="Loading administrator records" />
      ) : null}
      {current.isError ? (
        <div className="admin-state-panel">
          <h2>Records could not be loaded</h2>
          <p>{getErrorMessage(current.error, "Try loading this access directory again.")}</p>
          <button className="admin-secondary-button" onClick={() => void current.refetch()}>
            Try again
          </button>
        </div>
      ) : null}

      {!current.isLoading && !current.isError && view === "members" ? (
        <section className="admin-operator-list" aria-label="Administrators">
          {members.data?.data.map((member) => (
            <button
              className="admin-operator-row"
              key={member.id}
              onClick={() => setSelected(member)}
            >
              <span className="admin-directory-avatar">
                {(member.username || member.email).slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{member.username || member.email.split("@")[0]}</strong>
                <small>{member.email}</small>
              </span>
              <span
                className={
                  member.status === "suspended"
                    ? "admin-record-state is-restricted"
                    : "admin-record-state"
                }
              >
                {member.status}
              </span>
              <small>{member.isSuperAdmin ? "Protected super admin" : "Administrator"}</small>
            </button>
          ))}
          {!members.data?.data.length ? (
            <div className="admin-operator-empty">
              <h2>No administrators found</h2>
              <p>Try a different email search.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {!current.isLoading && !current.isError && view === "invites" ? (
        <section className="admin-operator-list" aria-label="Administrator invitations">
          {invites.data?.data.map((record) => (
            <article className="admin-invite-row" key={record.id}>
              <span>
                <strong>{record.email}</strong>
                <small>Invited by {record.invitedByEmail || "Gamerie operations"}</small>
              </span>
              <span
                className={
                  record.status !== "pending"
                    ? "admin-record-state is-restricted"
                    : "admin-record-state"
                }
              >
                {record.status}
              </span>
              <small>Expires {new Date(record.expiresAt).toLocaleDateString()}</small>
              {record.status === "pending" ? (
                <div>
                  <button
                    onClick={() => {
                      resend.reset();
                      setInviteAction({ kind: "resend", invite: record });
                    }}
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => {
                      revoke.reset();
                      setInviteAction({ kind: "revoke", invite: record });
                    }}
                  >
                    Revoke
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {!invites.data?.data.length ? (
            <div className="admin-operator-empty">
              <h2>No invitations found</h2>
              <p>New and historical invitations will appear here.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {(current.data?.totalPages ?? 0) > 1 ? (
        <nav className="admin-directory-pagination" aria-label="Administrator pages">
          <button
            className="admin-secondary-button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {current.data?.totalPages}
          </span>
          <button
            className="admin-secondary-button"
            disabled={page >= (current.data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}

      <DetailDrawer
        open={Boolean(selected)}
        eyebrow="Administrator access"
        title={selected?.username || selected?.email || "Administrator"}
        subtitle={selected?.email}
        onClose={() => setSelected(null)}
        actions={
          selected && !selected.isProtected && selected.userId !== user.id ? (
            <>
              <button
                className="admin-secondary-button"
                onClick={() => {
                  remove.reset();
                  setMemberAction({ kind: "remove", member: selected });
                }}
              >
                Remove access
              </button>
              <button
                className="admin-row-action"
                onClick={() => {
                  update.reset();
                  setMemberAction({ kind: "status", member: selected });
                }}
              >
                {selected.status === "active" ? "Suspend" : "Reactivate"}
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <DetailList
            items={[
              { label: "Access state", value: selected.status },
              {
                label: "Access level",
                value: selected.isSuperAdmin ? "Protected super admin" : "Administrator",
              },
              { label: "Invited by", value: selected.invitedByEmail },
              {
                label: "Last admin activity",
                value: selected.lastActiveAt
                  ? new Date(selected.lastActiveAt).toLocaleString()
                  : null,
              },
              {
                label: "Last sign in",
                value: selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : null,
              },
              { label: "Access created", value: new Date(selected.createdAt).toLocaleDateString() },
            ]}
          />
        ) : null}
      </DetailDrawer>

      {inviteOpen ? (
        <div
          className="admin-dialog"
          role="presentation"
          onMouseDown={() => !invite.isPending && setInviteOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-admin-title"
            onSubmit={submitInvite}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="invite-admin-title">Invite an administrator</h2>
              <p>
                They receive a single-use link that expires in seven days. Access begins only after
                acceptance.
              </p>
            </header>
            <label>
              <span>Email address</span>
              <input
                autoFocus
                type="email"
                required
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </label>
            {invite.isError ? (
              <p className="admin-dialog__error" role="alert">
                {getErrorMessage(invite.error, "The invitation could not be sent.")}
              </p>
            ) : null}
            <footer>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setInviteOpen(false)}
                disabled={invite.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={invite.isPending || !inviteEmail.trim()}
              >
                {invite.isPending ? "Sending…" : "Send invitation"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      <OperatorDialog
        open={Boolean(memberAction)}
        title={
          memberAction?.kind === "remove"
            ? "Remove administrator access"
            : memberAction?.member.status === "active"
              ? "Suspend administrator"
              : "Reactivate administrator"
        }
        description="This access change takes effect immediately and is written to the administrator audit log."
        confirmLabel={
          memberAction?.kind === "remove"
            ? "Remove access"
            : memberAction?.member.status === "active"
              ? "Suspend"
              : "Reactivate"
        }
        requireReason
        busy={actionMutation.isPending}
        error={
          actionMutation.isError
            ? getErrorMessage(actionMutation.error, "The access change could not be saved.")
            : undefined
        }
        onClose={() => !actionMutation.isPending && setMemberAction(null)}
        onConfirm={(reason) => {
          if (!memberAction) return;
          const done = {
            onSuccess: () => {
              setMemberAction(null);
              setSelected(null);
            },
          };
          if (memberAction.kind === "remove")
            remove.mutate({ id: memberAction.member.id, reason }, done);
          else
            update.mutate(
              {
                id: memberAction.member.id,
                status: memberAction.member.status === "active" ? "suspended" : "active",
                reason,
              },
              done,
            );
        }}
      />
      <OperatorDialog
        open={Boolean(inviteAction)}
        title={inviteAction?.kind === "revoke" ? "Revoke invitation" : "Resend invitation"}
        description={
          inviteAction?.kind === "revoke"
            ? "The current invitation link will stop working immediately."
            : "The current link will be replaced with a new seven-day invitation."
        }
        confirmLabel={inviteAction?.kind === "revoke" ? "Revoke" : "Resend"}
        busy={inviteMutation.isPending}
        error={
          inviteMutation.isError
            ? getErrorMessage(inviteMutation.error, "The invitation could not be updated.")
            : undefined
        }
        onClose={() => !inviteMutation.isPending && setInviteAction(null)}
        onConfirm={() => {
          if (!inviteAction) return;
          const done = { onSuccess: () => setInviteAction(null) };
          if (inviteAction.kind === "revoke") revoke.mutate(inviteAction.invite.id, done);
          else resend.mutate(inviteAction.invite.id, done);
        }}
      />
    </main>
  );
}
