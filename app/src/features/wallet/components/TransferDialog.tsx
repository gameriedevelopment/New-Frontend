import { ArrowLeft, Check, Coins, Search, Send, ShieldCheck, Users, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button, SafeImage, Skeleton, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useCommunityDirectory } from "../../communities/hooks";
import { useDebouncedValue, usePlayers } from "../../discovery/hooks";
import { useAuthStore } from "../../auth/authStore";
import { ProfileDialog } from "../../profile/components/interactions/ProfileDialog";
import { useTransferPersonalTokens } from "../hooks";
import type { TransferReceipt } from "../types";
import { formatToken, getTransferBreakdown } from "../utils";

type Recipient = {
  id: string;
  kind: "player" | "team";
  name: string;
  detail: string;
  image?: string;
};

function createTransferKey() {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `personal-transfer-${id}`;
}

export function TransferDialog({ available, onClose }: { available: number; onClose: () => void }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [step, setStep] = useState<"compose" | "review" | "receipt">("compose");
  const [kind, setKind] = useState<"player" | "team">("player");
  const [search, setSearch] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const idempotencyKey = useRef(createTransferKey());
  const debounced = useDebouncedValue(search, 240);
  const players = usePlayers({ search: debounced || undefined });
  const teams = useCommunityDirectory("teams", { search: debounced || undefined });
  const transfer = useTransferPersonalTokens();
  const playerResults = useMemo<Recipient[]>(
    () =>
      (players.data?.pages.flatMap((page) => page.data) ?? [])
        .filter((player) => player.id !== currentUserId)
        .map((player) => ({
          id: player.id,
          kind: "player",
          name: player.username || "Gamerie player",
          detail: player.gamerTitle || player.gameLevel || "Player",
          image: player.profileImage,
        })),
    [currentUserId, players.data],
  );
  const teamResults = useMemo<Recipient[]>(
    () =>
      (teams.data?.pages.flatMap((page) => page.items) ?? []).map((team) => ({
        id: team.id,
        kind: "team",
        name: team.name,
        detail: team.region || `${team.membersCount ?? team.members?.length ?? 0} members`,
        image: team.logo,
      })),
    [teams.data],
  );
  const results = kind === "player" ? playerResults : teamResults;
  const query = kind === "player" ? players : teams;
  const requested = Number(amount);
  const breakdown = getTransferBreakdown(requested, available);
  const validAmount = breakdown.valid;
  const { fee, received } = breakdown;
  const canReview = Boolean(recipient && validAmount);
  const submit = async () => {
    if (!recipient || !validAmount) return;
    const result = await transfer.mutateAsync({
      amount: requested,
      idempotencyKey: idempotencyKey.current,
      ...(recipient.kind === "player"
        ? { recipientUserId: recipient.id }
        : { teamId: recipient.id }),
    });
    setReceipt(result);
    setStep("receipt");
  };
  const selectKind = (next: "player" | "team") => {
    setKind(next);
    setRecipient(null);
    setSearch("");
  };

  return (
    <ProfileDialog
      title={
        step === "receipt"
          ? "Transfer complete"
          : step === "review"
            ? "Review transfer"
            : "Send GLK"
      }
      onClose={() => !transfer.isPending && onClose()}
    >
      <div className="wallet-transfer" data-step={step}>
        {step === "compose" ? (
          <>
            <div className="wallet-transfer__available">
              <span>Available to send</span>
              <strong>{formatToken(available)} GLK</strong>
            </div>
            <div className="wallet-transfer__switch" role="group" aria-label="Recipient type">
              <button
                type="button"
                aria-pressed={kind === "player"}
                onClick={() => selectKind("player")}
              >
                <Users size={14} />
                Player
              </button>
              <button
                type="button"
                aria-pressed={kind === "team"}
                onClick={() => selectKind("team")}
              >
                <ShieldCheck size={14} />
                Team
              </button>
            </div>
            <label className="wallet-transfer__search">
              <span>Recipient</span>
              <div>
                <Search size={16} />
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
                type="button"
                className="wallet-transfer__selected"
                onClick={() => setRecipient(null)}
              >
                <SafeImage src={recipient.image} fallback="/avatar-fallback.svg" alt="" />
                <span>
                  <strong>{recipient.name}</strong>
                  <small>{recipient.detail}</small>
                </span>
                <XCircle size={16} />
                <span className="sr-only">Change recipient</span>
              </button>
            ) : (
              <div className="wallet-transfer__results" aria-label={`${kind} results`}>
                {query.isLoading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <div key={index}>
                      <Skeleton height={38} width={38} />
                      <SkeletonText lines={2} />
                    </div>
                  ))
                ) : query.isError ? (
                  <p>Recipients could not load. Check your connection and try the search again.</p>
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
                        <Check size={15} />
                      </button>
                    ))}
                    {query.hasNextPage ? (
                      <button
                        type="button"
                        className="wallet-transfer__more"
                        disabled={query.isFetchingNextPage}
                        onClick={() => void query.fetchNextPage()}
                      >
                        {query.isFetchingNextPage
                          ? "Loading more…"
                          : `Load more ${kind === "player" ? "players" : "teams"}`}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p>
                    {search.trim()
                      ? `No ${kind === "player" ? "players" : "teams"} match this search.`
                      : `Choose a ${kind} to receive GLK.`}
                  </p>
                )}
              </div>
            )}
            <label className="wallet-transfer__amount">
              <span>Amount</span>
              <div>
                <Coins size={16} />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  max={available}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <b>GLK</b>
              </div>
              {requested > available ? (
                <small role="alert">This exceeds your available balance.</small>
              ) : requested > 0 ? (
                <small>The 2% transfer fee is deducted from this amount.</small>
              ) : null}
            </label>
            <footer>
              <Button variant="quiet" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!canReview} onClick={() => setStep("review")}>
                Review transfer
                <Send size={14} />
              </Button>
            </footer>
          </>
        ) : null}
        {step === "review" && recipient ? (
          <>
            <div className="wallet-transfer__recipient">
              <SafeImage src={recipient.image} fallback="/avatar-fallback.svg" alt="" />
              <span>
                <small>Sending to {recipient.kind}</small>
                <strong>{recipient.name}</strong>
                <p>{recipient.detail}</p>
              </span>
            </div>
            <dl className="wallet-transfer__review">
              <div>
                <dt>You send</dt>
                <dd>{formatToken(requested)} GLK</dd>
              </div>
              <div>
                <dt>Transfer fee</dt>
                <dd>{formatToken(fee)} GLK</dd>
              </div>
              <div>
                <dt>{recipient.name} receives</dt>
                <dd>{formatToken(received)} GLK</dd>
              </div>
              <div>
                <dt>Balance after transfer</dt>
                <dd>{formatToken(breakdown.remaining)} GLK</dd>
              </div>
            </dl>
            <p className="wallet-transfer__notice">
              <ShieldCheck size={15} />
              Confirm the recipient and amount carefully. Completed GLK transfers cannot be reversed
              from this screen.
            </p>
            {transfer.isError ? (
              <p className="wallet-transfer__error" role="alert">
                {getApiErrorMessage(
                  transfer.error,
                  "The transfer could not be completed. Your review is still here so you can retry safely.",
                )}
              </p>
            ) : null}
            <footer>
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
            </footer>
          </>
        ) : null}
        {step === "receipt" && recipient && receipt ? (
          <div className="wallet-transfer__receipt">
            <span>
              <Check size={24} />
            </span>
            <p>Transfer completed</p>
            <h3>
              {formatToken(receipt.metadata?.transferAmount ?? received)} GLK sent to{" "}
              {recipient.name}
            </h3>
            <dl>
              <div>
                <dt>Amount debited</dt>
                <dd>{formatToken(requested)} GLK</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>{formatToken(receipt.metadata?.commission ?? fee)} GLK</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{receipt.id.slice(0, 8).toUpperCase()}</dd>
              </div>
            </dl>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : null}
      </div>
    </ProfileDialog>
  );
}
