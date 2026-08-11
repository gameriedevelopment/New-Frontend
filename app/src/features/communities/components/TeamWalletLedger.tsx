import { ArrowDownLeft, ArrowUpRight, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { InfiniteLoadTrigger } from "../../discovery/components/InfiniteLoadTrigger";
import { formatToken } from "../../wallet/utils";
import { useTeamWalletTransactions } from "../hooks";
import type {
  TeamWalletTransaction,
  TeamWalletTransactionFilters,
  TeamWalletTransactionStatus,
  TeamWalletTransactionType,
} from "../types";

const typeOptions: Array<{ value: "" | TeamWalletTransactionType; label: string }> = [
  { value: "", label: "All activity" },
  { value: "INCOMING", label: "Received" },
  { value: "TRANSFER", label: "Sent" },
  { value: "CHALLENGE_RESERVE", label: "Challenge stakes" },
  { value: "CHALLENGE_RELEASE", label: "Released stakes" },
];
const statusOptions: Array<{ value: "" | TeamWalletTransactionStatus; label: string }> = [
  { value: "", label: "Any status" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

const labels: Record<TeamWalletTransactionType, string> = {
  INCOMING: "GLK received",
  OUTGOING: "GLK sent",
  TRANSFER: "GLK sent",
  CHALLENGE_RESERVE: "Challenge stake reserved",
  CHALLENGE_RELEASE: "Challenge stake released",
};

function direction(transaction: TeamWalletTransaction) {
  return ["INCOMING", "CHALLENGE_RELEASE"].includes(transaction.type) ? "in" : "out";
}

function TeamTransactionRow({ transaction }: { transaction: TeamWalletTransaction }) {
  const flow = direction(transaction);
  const StatusIcon =
    transaction.status === "COMPLETED"
      ? ShieldCheck
      : transaction.status === "FAILED"
        ? XCircle
        : Clock3;
  const date = new Date(transaction.timestamp || transaction.createdAt || "");
  return (
    <article className="team-wallet-transaction" data-direction={flow}>
      <span aria-hidden="true">
        {flow === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </span>
      <div>
        <strong>{labels[transaction.type]}</strong>
        <small>
          {transaction.metadata?.description ||
            (date.getTime()
              ? date.toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Date unavailable")}
        </small>
      </div>
      <div>
        <strong>
          {flow === "in" ? "+" : "−"}
          {formatToken(transaction.metadata?.transferAmount ?? transaction.amount)} GLK
        </strong>
        <small data-status={transaction.status.toLowerCase()}>
          <StatusIcon size={11} /> {transaction.status.toLowerCase()}
        </small>
      </div>
    </article>
  );
}

export function TeamWalletLedger({ teamId }: { teamId: string }) {
  const [type, setType] = useState<"" | TeamWalletTransactionType>("");
  const [status, setStatus] = useState<"" | TeamWalletTransactionStatus>("");
  const filters = useMemo<TeamWalletTransactionFilters>(
    () => ({ type: type || undefined, status: status || undefined }),
    [status, type],
  );
  const query = useTeamWalletTransactions(teamId, filters, true);
  const transactions = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <section className="team-wallet-ledger" aria-labelledby="team-wallet-ledger-title">
      <header>
        <div>
          <p>Ledger history</p>
          <h3 id="team-wallet-ledger-title">Team transactions</h3>
          <span>
            Showing {transactions.length.toLocaleString()} of {total.toLocaleString()}
          </span>
        </div>
        <div>
          <label>
            <span>Activity</span>
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {query.isLoading ? (
        <div className="team-wallet-ledger__loading">
          <SkeletonText lines={6} />
        </div>
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="Team transactions could not load"
          description={getApiErrorMessage(
            query.error,
            "The Team ledger is temporarily unavailable.",
          )}
          action={
            <Button size="small" variant="secondary" onClick={() => query.refetch()}>
              <RefreshCw size={13} />
              Retry
            </Button>
          }
        />
      ) : transactions.length ? (
        <>
          <div className="team-wallet-ledger__rows">
            {transactions.map((transaction) => (
              <TeamTransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
          <InfiniteLoadTrigger
            fetching={query.isFetchingNextPage}
            hasMore={Boolean(query.hasNextPage)}
            label="Load more Team transactions"
            onLoad={() => {
              if (!query.isFetchingNextPage) void query.fetchNextPage();
            }}
          />
        </>
      ) : (
        <div className="team-wallet-ledger__empty">
          <strong>No Team wallet activity in this view</strong>
          <p>
            {type || status
              ? "Try another activity or status filter."
              : "Transfers and challenge stakes will appear here when they happen."}
          </p>
        </div>
      )}
    </section>
  );
}
