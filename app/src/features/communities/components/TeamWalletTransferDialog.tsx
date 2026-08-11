import { ArrowLeft, Check, Coins, Search, Send, ShieldCheck, Users, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button, SafeImage, Skeleton, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useDebouncedValue, usePlayers } from "../../discovery/hooks";
import { formatToken, getTransferBreakdown } from "../../wallet/utils";
import { useCommunityDirectory, useTransferTeamWalletTokens } from "../hooks";
import type { TeamWalletTransaction } from "../types";
import { CommunityDialog } from "./CommunityDialog";

type Recipient = {
  id: string;
  kind: "player" | "team";
  name: string;
  detail: string;
  image?: string;
};

function createTransferKey(teamId: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `team-${teamId}-transfer-${id}`;
}

export function TeamWalletTransferDialog({
  teamId,
  teamName,
  available,
  onClose,
}: {
  teamId: string;
  teamName: string;
  available: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"compose" | "review" | "receipt">("compose");
  const [kind, setKind] = useState<"player" | "team">("player");
  const [search, setSearch] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<TeamWalletTransaction | null>(null);
  const idempotencyKey = useRef(createTransferKey(teamId));
  const debounced = useDebouncedValue(search, 240);
  const players = usePlayers({ search: debounced || undefined, includeCurrentUser: true });
  const teams = useCommunityDirectory("teams", { search: debounced || undefined });
  const transfer = useTransferTeamWalletTokens(teamId);
  const playerResults = useMemo<Recipient[]>(
    () =>
      (players.data?.pages.flatMap((page) => page.data) ?? []).map((player) => ({
        id: player.id,
        kind: "player",
        name: player.username || "Gamerie player",
        detail: player.gamerTitle || player.gameLevel || "Player",
        image: player.profileImage,
      })),
    [players.data],
  );
  const teamResults = useMemo<Recipient[]>(
    () =>
      (teams.data?.pages.flatMap((page) => page.items) ?? [])
        .filter((team) => team.id !== teamId)
        .map((team) => ({
          id: team.id,
          kind: "team",
          name: team.name,
          detail: team.region || `${team.membersCount ?? team.members?.length ?? 0} members`,
          image: team.logo,
        })),
    [teamId, teams.data],
  );
  const results = kind === "player" ? playerResults : teamResults;
  const query = kind === "player" ? players : teams;
  const requested = Number(amount);
  const breakdown = getTransferBreakdown(requested, available);
  const canReview = Boolean(recipient && breakdown.valid);

  const selectKind = (next: "player" | "team") => {
    setKind(next);
    setRecipient(null);
    setSearch("");
  };
  const submit = async () => {
    if (!recipient || !breakdown.valid) return;
    try {
      const result = await transfer.mutateAsync({
        teamId,
        amount: requested,
        idempotencyKey: idempotencyKey.current,
        ...(recipient.kind === "player"
          ? { recipientUserId: recipient.id }
          : { recipientTeamId: recipient.id }),
      });
      setReceipt(result);
      setStep("receipt");
    } catch {
      // Mutation state keeps the review intact and renders the recoverable error.
    }
  };

  return (
    <CommunityDialog
      title={
        step === "receipt"
          ? "Transfer complete"
          : step === "review"
            ? "Review Team transfer"
            : "Send Team GLK"
      }
      onClose={() => !transfer.isPending && onClose()}
    >
      <div className="team-wallet-transfer" data-step={step}>
        {step === "compose" ? (
          <div className="community-dialog__body">
            <div className="team-wallet-transfer__balance">
              <span>{teamName} can send</span>
              <strong>{formatToken(available)} GLK</strong>
            </div>
            <div className="team-wallet-transfer__kinds" role="group" aria-label="Recipient type">
              <button
                type="button"
                aria-pressed={kind === "player"}
                onClick={() => selectKind("player")}
              >
                <Users size={14} /> Player
              </button>
              <button
                type="button"
                aria-pressed={kind === "team"}
                onClick={() => selectKind("team")}
              >
                <ShieldCheck size={14} /> Team
              </button>
            </div>
            <label className="team-wallet-transfer__search">
              <span>Recipient</span>
              <div>
                <Search size={15} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setRecipient(null);
                  }}
                  placeholder={`Search ${kind === "player" ? "players" : "teams"}`}
                  autoComplete="off"
                />
              </div>
            </label>
            {recipient ? (
              <button
                className="team-wallet-transfer__selected"
                type="button"
                onClick={() => setRecipient(null)}
              >
                <SafeImage src={recipient.image} fallback="/avatar-fallback.svg" alt="" />
                <span>
                  <strong>{recipient.name}</strong>
                  <small>{recipient.detail}</small>
                </span>
                <XCircle size={15} />
                <span className="sr-only">Change recipient</span>
              </button>
            ) : (
              <div className="team-wallet-transfer__results">
                {query.isLoading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <div key={index}>
                      <Skeleton width={36} height={36} />
                      <SkeletonText lines={2} />
                    </div>
                  ))
                ) : query.isError ? (
                  <p>Recipients could not load. Try the search again.</p>
                ) : results.length ? (
                  <>
                    {results.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setRecipient(item);
                          setSearch(item.name);
                        }}
                      >
                        <SafeImage src={item.image} fallback="/avatar-fallback.svg" alt="" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.detail}</small>
                        </span>
                        <Check size={14} />
                      </button>
                    ))}
                    {query.hasNextPage ? (
                      <button
                        type="button"
                        className="team-wallet-transfer__more"
                        disabled={query.isFetchingNextPage}
                        onClick={() => void query.fetchNextPage()}
                      >
                        {query.isFetchingNextPage ? "Loading more…" : "Load more"}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p>
                    {search.trim() ? "No matching recipient found." : "Choose who receives GLK."}
                  </p>
                )}
              </div>
            )}
            <label className="team-wallet-transfer__amount">
              <span>Amount</span>
              <div>
                <Coins size={15} />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.00000001"
                  step="0.01"
                  max={available}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <b>GLK</b>
              </div>
              {requested > available ? (
                <small role="alert">This exceeds the Team's available balance.</small>
              ) : requested > 0 ? (
                <small>The 2% transfer fee is deducted from this amount.</small>
              ) : null}
            </label>
          </div>
        ) : null}
        {step === "review" && recipient ? (
          <div className="community-dialog__body">
            <div className="team-wallet-transfer__recipient">
              <SafeImage src={recipient.image} fallback="/avatar-fallback.svg" alt="" />
              <span>
                <small>Sending from {teamName}</small>
                <strong>{recipient.name}</strong>
                <p>{recipient.detail}</p>
              </span>
            </div>
            <dl className="team-wallet-transfer__review">
              <div>
                <dt>Team sends</dt>
                <dd>{formatToken(requested)} GLK</dd>
              </div>
              <div>
                <dt>Transfer fee</dt>
                <dd>{formatToken(breakdown.fee)} GLK</dd>
              </div>
              <div>
                <dt>{recipient.name} receives</dt>
                <dd>{formatToken(breakdown.received)} GLK</dd>
              </div>
              <div>
                <dt>Team balance after</dt>
                <dd>{formatToken(breakdown.remaining)} GLK</dd>
              </div>
            </dl>
            <p className="team-wallet-transfer__notice">
              <ShieldCheck size={15} />
              Confirm the recipient and amount. Completed Team-wallet transfers cannot be reversed
              from this screen.
            </p>
            {transfer.isError ? (
              <p className="community-action-error" role="alert">
                {getApiErrorMessage(
                  transfer.error,
                  "The Team transfer could not be completed. Your review remains available for a safe retry.",
                )}
              </p>
            ) : null}
          </div>
        ) : null}
        {step === "receipt" && recipient && receipt ? (
          <div className="team-wallet-transfer__receipt">
            <span>
              <Check size={23} />
            </span>
            <p>Transfer completed</p>
            <h3>
              {formatToken(receipt.metadata?.transferAmount ?? breakdown.received)} GLK sent to{" "}
              {recipient.name}
            </h3>
            <dl>
              <div>
                <dt>Debited</dt>
                <dd>{formatToken(requested)} GLK</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{formatToken(receipt.metadata?.commission ?? breakdown.fee)} GLK</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{receipt.id.slice(0, 8).toUpperCase()}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
      <footer>
        {step === "compose" ? (
          <>
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!canReview} onClick={() => setStep("review")}>
              Review transfer <Send size={14} />
            </Button>
          </>
        ) : null}
        {step === "review" ? (
          <>
            <Button
              variant="quiet"
              disabled={transfer.isPending}
              onClick={() => setStep("compose")}
            >
              <ArrowLeft size={14} />
              Back
            </Button>
            <Button disabled={transfer.isPending} onClick={() => void submit()}>
              {transfer.isPending ? "Sending safely…" : `Send ${formatToken(requested)} GLK`}
            </Button>
          </>
        ) : null}
        {step === "receipt" ? <Button onClick={onClose}>Done</Button> : null}
      </footer>
    </CommunityDialog>
  );
}
