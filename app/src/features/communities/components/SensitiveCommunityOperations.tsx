import { ArrowRightLeft, Check, Copy, LockKeyhole, Send, Trash2, WalletCards } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, SafeImage, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { WalletActivityChart } from "../../wallet/components/WalletActivityChart";
import {
  useDeleteCommunity,
  useTeamWallet,
  useTeamWalletInsights,
  useTransferCommunityOwnership,
} from "../hooks";
import type { CommunityMember, HubSummary, TeamSummary } from "../types";
import { CommunityDialog } from "./CommunityDialog";
import { TeamWalletLedger } from "./TeamWalletLedger";
import { TeamWalletTransferDialog } from "./TeamWalletTransferDialog";

const memberId = (member: CommunityMember) => member.user?.id || member.userId || member.id || "";
const memberName = (member: CommunityMember) =>
  member.user?.displayName || member.user?.username || "Gamerie player";

function compactAddress(value?: string) {
  if (!value) return "Not available";
  return value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value;
}

export function SensitiveCommunityOperations({
  kind,
  item,
  slug,
}: {
  kind: "team" | "hub";
  item: TeamSummary | HubSummary;
  slug: string;
}) {
  const navigate = useNavigate();
  const relationship = item.viewerRelationship;
  const [dialog, setDialog] = useState<"transfer" | "delete" | null>(null);
  const [walletTransferOpen, setWalletTransferOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const wallet = useTeamWallet(item.id, kind === "team" && Boolean(relationship?.isOwner));
  const walletInsights = useTeamWalletInsights(
    item.id,
    kind === "team" && Boolean(relationship?.isOwner),
  );
  const transfer = useTransferCommunityOwnership(kind, item.id, slug);
  const remove = useDeleteCommunity(kind, item.id);
  const eligibleMembers = useMemo(
    () =>
      (item.members ?? []).filter(
        (member) =>
          member.isActive !== false && memberId(member) && memberId(member) !== item.ownerId,
      ),
    [item.members, item.ownerId],
  );
  const selectedMember = eligibleMembers.find((member) => memberId(member) === newOwnerId);
  const glk = wallet.data?.balances?.find(
    (balance) => balance.tokenId === "glk-token" || balance.token?.symbol?.toLowerCase() === "glk",
  );
  const reservations = Object.entries(wallet.data?.reservedBalances ?? {});
  const balance = Number(glk?.amount || 0);
  const reserved = reservations.reduce(
    (total, [, reservation]) => total + Number(reservation.amount || 0),
    0,
  );
  const available = Math.max(0, balance - reserved);
  const walletMutationsEnabled = import.meta.env.VITE_WALLET_TRANSACTIONS_ENABLED === "true";

  if (!relationship?.isOwner) return null;

  const copyAddress = async () => {
    if (!wallet.data?.address) return;
    try {
      await navigator.clipboard.writeText(wallet.data.address);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  const open = (next: "transfer" | "delete") => {
    setDialog(next);
    setConfirmation("");
    if (next === "transfer") setNewOwnerId("");
  };
  const transferNow = async () => {
    if (!newOwnerId || confirmation !== item.name) return;
    try {
      await transfer.mutateAsync(newOwnerId);
      setDialog(null);
      setConfirmation("");
      setNewOwnerId("");
    } catch {}
  };
  const deleteNow = async () => {
    if (confirmation !== item.name) return;
    try {
      await remove.mutateAsync();
      navigate(`/${kind}s`, { replace: true });
    } catch {}
  };

  return (
    <>
      {kind === "team" ? (
        <section className="community-section community-sensitive__wallet" id="team-wallet">
          <header>
            <div>
              <h2>Team wallet</h2>
              <p>Owner-only balance, transfers, reservations, and ledger.</p>
            </div>
            <div className="community-sensitive__wallet-actions">
              <Button
                size="small"
                disabled={!walletMutationsEnabled || !wallet.data}
                title={
                  walletMutationsEnabled
                    ? "Send Team GLK"
                    : "Team transfers open when Gamerie Wallet launches"
                }
                onClick={() => setWalletTransferOpen(true)}
              >
                <Send size={13} /> Send GLK
              </Button>
              <WalletCards size={17} />
            </div>
          </header>
          {wallet.isLoading ? (
            <SkeletonText lines={5} />
          ) : wallet.isError ? (
            <StatePanel
              tone="error"
              title="Team wallet could not load"
              description={getApiErrorMessage(
                wallet.error,
                "The wallet is temporarily unavailable.",
              )}
              action={
                <Button size="small" variant="secondary" onClick={() => wallet.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : wallet.data ? (
            <>
              <div className="community-wallet-summary">
                <div>
                  <span>Total GLK</span>
                  <strong>{balance.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Available GLK</span>
                  <strong>{available.toLocaleString()}</strong>
                </div>
                <button type="button" onClick={copyAddress} disabled={!wallet.data.address}>
                  <span>Wallet address</span>
                  <strong>{copied ? "Copied" : compactAddress(wallet.data.address)}</strong>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <div className="community-reservations">
                <div>
                  <strong>Challenge reservations</strong>
                  <span>{reservations.length} active</span>
                </div>
                {reservations.length ? (
                  reservations.map(([challengeId, reservation]) => (
                    <article key={challengeId}>
                      <LockKeyhole size={14} />
                      <div>
                        <strong>{Number(reservation.amount || 0).toLocaleString()} GLK</strong>
                        <span>Challenge {challengeId.slice(0, 8)}</span>
                      </div>
                      {reservation.expiresAt ? (
                        <time>
                          {new Date(reservation.expiresAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      ) : (
                        <span>Challenge controlled</span>
                      )}
                    </article>
                  ))
                ) : (
                  <p>No tokens are reserved for an active challenge.</p>
                )}
              </div>
              <WalletActivityChart
                title="Team wallet activity"
                description="Owner-only inflow, outflow, and challenge reservations."
                points={(walletInsights.data?.monthlyTrends ?? []).map((point) => ({
                  label: point.month,
                  values: [
                    { label: "Inflow", value: point.inflow, tone: "success" as const },
                    { label: "Outflow", value: point.outflow, tone: "accent" as const },
                    { label: "Reserved", value: point.reserved, tone: "warning" as const },
                  ],
                }))}
              />
              <TeamWalletLedger teamId={item.id} />
              <p className="community-sensitive__note">
                Reservations are created and released by the verified challenge lifecycle. Manual
                release is intentionally unavailable here.
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      {walletTransferOpen && kind === "team" ? (
        <TeamWalletTransferDialog
          teamId={item.id}
          teamName={item.name}
          available={available}
          onClose={() => setWalletTransferOpen(false)}
        />
      ) : null}

      <section className="community-section community-sensitive" id={`${kind}-sensitive`}>
        <header>
          <div>
            <h2>Ownership and removal</h2>
            <p>These changes affect every member and cannot be silently reversed.</p>
          </div>
        </header>
        <div className="community-sensitive__actions">
          <div>
            <span>Transfer ownership</span>
            <p>
              Choose an active member to become the new owner. You will remain as a regular{" "}
              {kind === "team" ? "member" : "administrator"}.
            </p>
            <Button
              variant="secondary"
              disabled={!eligibleMembers.length}
              onClick={() => open("transfer")}
            >
              <ArrowRightLeft size={14} />
              Transfer ownership
            </Button>
            {!eligibleMembers.length ? (
              <small>Add another active member before ownership can be transferred.</small>
            ) : null}
          </div>
          <div className="community-sensitive__danger">
            <span>Delete {kind}</span>
            <p>Permanently remove this {kind}, its membership, content, and connected records.</p>
            <Button variant="quiet" onClick={() => open("delete")}>
              <Trash2 size={14} />
              Delete {kind}
            </Button>
          </div>
        </div>
      </section>

      {dialog === "transfer" ? (
        <CommunityDialog
          title={`Transfer ${kind} ownership`}
          onClose={() => !transfer.isPending && setDialog(null)}
        >
          <div className="community-dialog__body">
            <p>
              Select the new owner, then type <strong>{item.name}</strong> to confirm. Ownership
              permissions change immediately.
            </p>
            <label>
              <span>New owner</span>
              <select value={newOwnerId} onChange={(event) => setNewOwnerId(event.target.value)}>
                <option value="">Select an active member</option>
                {eligibleMembers.map((member) => (
                  <option key={memberId(member)} value={memberId(member)}>
                    {memberName(member)}
                    {member.user?.username ? ` (@${member.user.username})` : ""}
                  </option>
                ))}
              </select>
            </label>
            {selectedMember ? (
              <div className="community-transfer-person">
                <SafeImage
                  src={selectedMember.user?.profileImage}
                  fallback="/avatar-fallback.svg"
                  alt=""
                />
                <span>
                  <strong>{memberName(selectedMember)}</strong>
                  <small>Will receive full owner access</small>
                </span>
              </div>
            ) : null}
            <label>
              <span>Type the {kind} name to confirm</span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
              />
            </label>
            {transfer.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(transfer.error, "Ownership could not be transferred.")}
              </p>
            ) : null}
          </div>
          <footer>
            <Button variant="quiet" disabled={transfer.isPending} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!newOwnerId || confirmation !== item.name || transfer.isPending}
              onClick={transferNow}
            >
              {transfer.isPending ? "Transferring…" : "Transfer ownership"}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
      {dialog === "delete" ? (
        <CommunityDialog
          title={`Delete ${item.name}?`}
          onClose={() => !remove.isPending && setDialog(null)}
        >
          <div className="community-dialog__body">
            <p>
              This permanently deletes the {kind}, its posts, membership, requests, and connected
              records. Type <strong>{item.name}</strong> to continue.
            </p>
            <label>
              <span>{kind === "team" ? "Team" : "Hub"} name</span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
              />
            </label>
            {remove.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(remove.error, `This ${kind} could not be deleted.`)}
              </p>
            ) : null}
          </div>
          <footer>
            <Button variant="quiet" disabled={remove.isPending} onClick={() => setDialog(null)}>
              Keep {kind}
            </Button>
            <Button
              className="community-danger-button"
              disabled={confirmation !== item.name || remove.isPending}
              onClick={deleteNow}
            >
              {remove.isPending ? "Deleting…" : `Delete ${kind}`}
            </Button>
          </footer>
        </CommunityDialog>
      ) : null}
    </>
  );
}
