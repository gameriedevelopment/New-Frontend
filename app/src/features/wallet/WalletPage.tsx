import {
  Activity,
  Coins,
  CreditCard,
  LockKeyhole,
  RefreshCw,
  Send,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { PaymentMethodDialog } from "./components/PaymentMethodDialog";
import { PaymentMethodsPanel } from "./components/PaymentMethodsPanel";
import { TransactionRow } from "./components/TransactionRow";
import { PurchaseDialog } from "./components/PurchaseDialog";
import { TransferDialog } from "./components/TransferDialog";
import { WalletActivityChart } from "./components/WalletActivityChart";
import { useWallet, useWalletInsights, useWalletTransactions } from "./hooks";
import type { WalletTransactionStatus, WalletTransactionType } from "./types";
import { formatToken } from "./utils";
import "./wallet.css";

const typeOptions: Array<{ value: "" | WalletTransactionType; label: string }> = [
  { value: "", label: "All activity" },
  { value: "PURCHASE", label: "Purchases" },
  { value: "TRANSFER", label: "Sent" },
  { value: "INCOMING", label: "Received" },
  { value: "REWARD", label: "Rewards" },
  { value: "CHALLENGE_RESERVE", label: "Challenge stakes" },
  { value: "WITHDRAWAL", label: "Withdrawals" },
];
const statusOptions: Array<{ value: "" | WalletTransactionStatus; label: string }> = [
  { value: "", label: "Any status" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

function WalletSkeleton() {
  return (
    <div className="wallet-loading" aria-label="Loading wallet">
      <Skeleton height={212} />
      <div>
        <Skeleton height={96} />
        <Skeleton height={96} />
        <Skeleton height={96} />
      </div>
      <section>
        {Array.from({ length: 5 }, (_, i) => (
          <article key={i}>
            <Skeleton height={38} width={38} />
            <SkeletonText lines={2} />
            <Skeleton height={28} width="20%" />
          </article>
        ))}
      </section>
    </div>
  );
}

export function WalletPage() {
  const [transferOpen, setTransferOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const rawType = params.get("type") as WalletTransactionType | null;
  const rawStatus = params.get("status") as WalletTransactionStatus | null;
  const type = typeOptions.some((option) => option.value === rawType)
    ? rawType || undefined
    : undefined;
  const status = statusOptions.some((option) => option.value === rawStatus)
    ? rawStatus || undefined
    : undefined;
  const filters = useMemo(() => ({ type, status }), [status, type]);
  const wallet = useWallet();
  const insights = useWalletInsights();
  const transactions = useWalletTransactions(filters);
  const items = transactions.data?.pages.flatMap((page) => page.data) ?? [];
  const total = transactions.data?.pages[0]?.total ?? 0;
  const glk = wallet.data?.balances.find(
    (balance) => balance.tokenId === "glk-token" || balance.symbol === "GLK",
  );
  const rewards = wallet.data?.balances.find(
    (balance) => balance.tokenId === "reward-token" || balance.type === "REWARD",
  );
  const reserved = Object.values(wallet.data?.reservedBalances ?? {}).reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const balance = Number(glk?.amount || 0);
  const available = Math.max(0, balance - reserved);
  const metrics = insights.data?.metrics;
  const transactionsEnabled = import.meta.env.VITE_WALLET_TRANSACTIONS_ENABLED === "true";
  const chartPoints = (insights.data?.trendData ?? []).map((point) => ({
    label: point.month,
    values: [
      { label: "Purchased", value: point.purchased, tone: "success" as const },
      { label: "Transferred", value: point.transferred, tone: "accent" as const },
      { label: "Reserved", value: point.reserved, tone: "warning" as const },
    ],
  }));
  const setFilter = (key: "type" | "status", value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const retry = () => {
    void wallet.refetch();
    void insights.refetch();
    void transactions.refetch();
  };

  if (wallet.isLoading || transactions.isLoading)
    return (
      <main className="wallet-page">
        <WalletSkeleton />
      </main>
    );
  if (wallet.isError)
    return (
      <main className="wallet-page">
        <StatePanel
          tone="error"
          title="Your wallet could not load"
          description={getApiErrorMessage(
            wallet.error,
            "Gamerie could not retrieve your balance right now.",
          )}
          action={
            <Button variant="secondary" onClick={retry}>
              <RefreshCw size={14} />
              Try again
            </Button>
          }
        />
      </main>
    );

  return (
    <main className="wallet-page">
      <header className="wallet-heading">
        <div>
          <p>Personal wallet</p>
          <h1>Your GLK, clearly accounted for.</h1>
          <span>
            Review available funds, reserved challenge stakes, rewards, and every ledger movement in
            one place.
          </span>
        </div>
        <div className="wallet-heading__actions">
          <Button
            disabled={!transactionsEnabled}
            title={transactionsEnabled ? "Send GLK" : "Transfers open when the wallet launches"}
            onClick={() => setTransferOpen(true)}
          >
            <Send size={14} />
            Send GLK
          </Button>
        </div>
      </header>
      <aside className="wallet-preview" aria-label="Wallet launch status">
        <div>
          <p>Coming soon</p>
          <strong>Wallet preview</strong>
          <span>
            Your live balance and ledger are visible now. Purchases, payment setup, transfers, and
            withdrawals remain release-gated until Gamerie Wallet launches.
          </span>
        </div>
        <span>Preview access</span>
      </aside>
      <section className="wallet-balance" aria-labelledby="wallet-balance-title">
        <div className="wallet-balance__primary">
          <span>
            <Coins size={17} />
            Glink balance
          </span>
          <strong id="wallet-balance-title">
            {formatToken(balance)}
            <small>GLK</small>
          </strong>
          <p>{formatToken(available)} GLK available to use</p>
        </div>
        <dl>
          <div>
            <dt>
              <WalletCards size={15} />
              Available
            </dt>
            <dd>{formatToken(available)} GLK</dd>
            <small>Balance after active reservations</small>
          </div>
          <div>
            <dt>
              <LockKeyhole size={15} />
              Reserved
            </dt>
            <dd>{formatToken(reserved)} GLK</dd>
            <small>Held for accepted challenges</small>
          </div>
          <div>
            <dt>
              <Activity size={15} />
              Reward points
            </dt>
            <dd>{formatToken(rewards?.amount || 0, 0)}</dd>
            <small>Separate from spendable GLK</small>
          </div>
        </dl>
      </section>
      <section className="wallet-insights" aria-label="Wallet summary">
        <div>
          <span>Purchased</span>
          <strong>{formatToken(metrics?.totalPurchased || 0)} GLK</strong>
        </div>
        <div>
          <span>Transferred</span>
          <strong>{formatToken(metrics?.totalTransferred || 0)} GLK</strong>
        </div>
        <div>
          <span>Challenge stakes</span>
          <strong>{formatToken(metrics?.totalReserved || 0)} GLK</strong>
        </div>
        <div>
          <span>Fees paid</span>
          <strong>{formatToken(metrics?.totalFees || 0)} GLK</strong>
        </div>
      </section>
      <WalletActivityChart
        title="Monthly wallet activity"
        description="Completed purchases, transfers, and challenge reservations."
        points={chartPoints}
      />
      <section className="wallet-services" aria-labelledby="wallet-services-title">
        <header>
          <div>
            <p>Wallet services</p>
            <h2 id="wallet-services-title">Ready for launch</h2>
            <span>The full flows are retained behind the wallet release gate.</span>
          </div>
        </header>
        <div>
          <article>
            <CreditCard size={17} />
            <div>
              <strong>Purchase GLK</strong>
              <span>Buy GLK using a securely saved payment method.</span>
            </div>
            <Button
              size="small"
              variant="secondary"
              disabled={!transactionsEnabled}
              onClick={() => setPurchaseOpen(true)}
            >
              Purchase
            </Button>
          </article>
          <article>
            <WalletCards size={17} />
            <div>
              <strong>Payment methods</strong>
              <span>Cards are tokenized by Stripe; Gamerie never stores raw card details.</span>
            </div>
            <Button
              size="small"
              variant="secondary"
              disabled={!transactionsEnabled}
              onClick={() => setPaymentMethodOpen(true)}
            >
              Manage methods
            </Button>
          </article>
          <article>
            <Send size={17} />
            <div>
              <strong>Withdrawals</strong>
              <span>
                Bank settlement stays unavailable until compliance and payout operations launch.
              </span>
            </div>
            <small>Coming soon</small>
          </article>
        </div>
      </section>
      <PaymentMethodsPanel enabled={transactionsEnabled} onAdd={() => setPaymentMethodOpen(true)} />
      <section className="wallet-history">
        <header>
          <div>
            <p>Ledger history</p>
            <h2>Transactions</h2>
            <span>
              Showing {items.length.toLocaleString()} of {total.toLocaleString()}{" "}
              {total === 1 ? "record" : "records"}
            </span>
          </div>
          <div className="wallet-history__filters">
            <label>
              <span>Activity</span>
              <select
                value={type || ""}
                onChange={(event) => setFilter("type", event.target.value)}
              >
                {typeOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={status || ""}
                onChange={(event) => setFilter("status", event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        {transactions.isError ? (
          <StatePanel
            tone="error"
            title="Transactions could not load"
            description={getApiErrorMessage(
              transactions.error,
              "Your balance is safe, but the ledger could not be retrieved right now.",
            )}
            action={
              <Button variant="secondary" onClick={() => transactions.refetch()}>
                Try again
              </Button>
            }
          />
        ) : items.length ? (
          <>
            <div className="wallet-transaction-list">
              {items.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
            <InfiniteLoadTrigger
              fetching={transactions.isFetchingNextPage}
              hasMore={Boolean(transactions.hasNextPage)}
              label="Load more transactions"
              onLoad={() => {
                if (!transactions.isFetchingNextPage) void transactions.fetchNextPage();
              }}
            />
          </>
        ) : (
          <StatePanel
            icon={<WalletCards size={20} />}
            title="No wallet activity in this view"
            description={
              type || status
                ? "Try another activity or status filter."
                : "Purchases, transfers, challenge stakes, and rewards will appear here when they happen."
            }
          />
        )}
      </section>
      {transferOpen ? (
        <TransferDialog available={available} onClose={() => setTransferOpen(false)} />
      ) : null}
      {purchaseOpen ? <PurchaseDialog onClose={() => setPurchaseOpen(false)} /> : null}
      {paymentMethodOpen ? (
        <PaymentMethodDialog onClose={() => setPaymentMethodOpen(false)} />
      ) : null}
    </main>
  );
}
