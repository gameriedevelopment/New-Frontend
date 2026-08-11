import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminAvatar } from "../../components/AdminAvatar";
import { BarChart, LineChart } from "../../components/DataChart";
import { getErrorMessage } from "../../lib/errors";
import {
  useCreateReferralCode,
  useDeleteReferralCode,
  useFinanceSummary,
  useFinanceTransactions,
  useReferralCodes,
  useReferralSignups,
  useUpdateReferralStatus,
  useWalletFlow,
} from "./hooks";
import type { LedgerRecord, ReferralCodeRecord, ReferralInput } from "./types";
import "./finance.css";

const compactNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function FinanceGrowthPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "referrals" ? "referrals" : "finance";
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<{
    record: ReferralCodeRecord;
    kind: "status" | "delete";
  } | null>(null);
  const [signupCode, setSignupCode] = useState<ReferralCodeRecord | null>(null);
  const summary = useFinanceSummary(view === "finance");
  const walletFlow = useWalletFlow(view === "finance");
  const ledger = useFinanceTransactions(
    {
      page,
      limit: 20,
      search: term || undefined,
      scope: filter ? (filter as "personal" | "team") : undefined,
    },
    view === "finance",
  );
  const referrals = useReferralCodes(
    {
      page,
      limit: 20,
      search: term || undefined,
      status: filter ? (filter as "active" | "inactive" | "expired") : undefined,
    },
    view === "referrals",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const changeView = (next: "finance" | "referrals") => {
    setParams(next === "finance" ? {} : { view: next });
    setSearch("");
    setTerm("");
    setFilter("");
    setPage(1);
  };
  const query = view === "finance" ? ledger : referrals;

  return (
    <main className="finance-page">
      <header className="finance-heading">
        <div>
          <span className="admin-eyebrow">Finance and growth</span>
          <h1>{view === "finance" ? "Financial operations" : "Referral programmes"}</h1>
          <p>
            {view === "finance"
              ? "Review separated fiat purchases, GLK movement, and commission activity without mixing units."
              : "Manage attributable partner codes with bounded results, explicit status changes, and a permanent audit trail."}
          </p>
        </div>
        {view === "referrals" ? (
          <button className="admin-primary-button" onClick={() => setCreateOpen(true)}>
            Create referral code
          </button>
        ) : null}
      </header>

      <div className="finance-tabs" role="tablist" aria-label="Finance and growth views">
        <button role="tab" aria-selected={view === "finance"} onClick={() => changeView("finance")}>
          Finance
        </button>
        <button
          role="tab"
          aria-selected={view === "referrals"}
          onClick={() => changeView("referrals")}
        >
          Referrals
        </button>
      </div>

      {view === "finance" ? <FinanceSummary query={summary} walletFlow={walletFlow} /> : null}

      <section className="finance-toolbar" aria-label={`${view} filters`}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            view === "finance" ? "Search owner or transaction ID" : "Search code or source"
          }
        />
        <select
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter records"
        >
          <option value="">All {view === "finance" ? "wallets" : "statuses"}</option>
          {view === "finance" ? (
            <>
              <option value="personal">Personal wallets</option>
              <option value="team">Team wallets</option>
            </>
          ) : (
            <>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </>
          )}
        </select>
      </section>

      <div className="finance-context">
        <span>{query.isFetching ? "Updating…" : `${query.data?.total ?? 0} records`}</span>
        <span>Page {page}</span>
      </div>
      {query.isError ? (
        <FinanceState
          title="This workspace could not be loaded"
          copy={getErrorMessage(query.error, "Please try again.")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <div className="finance-list" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <i className="finance-skeleton" key={index} />
          ))}
        </div>
      ) : !query.data?.data.length ? (
        <FinanceState
          title="No matching records"
          copy="Adjust the search or filter to broaden this operational view."
        />
      ) : view === "finance" ? (
        <div className="finance-list">
          {(ledger.data?.data ?? []).map((record) => (
            <LedgerRow key={record.id} record={record} onOpen={setSelectedTransaction} />
          ))}
        </div>
      ) : (
        <div className="finance-list">
          {(referrals.data?.data ?? []).map((record) => (
            <ReferralRow
              key={record.id}
              record={record}
              onAction={(kind) => setAction({ record, kind })}
              onSignups={() => setSignupCode(record)}
            />
          ))}
        </div>
      )}
      {(query.data?.totalPages ?? 0) > 1 ? (
        <nav className="finance-pagination" aria-label="Result pages">
          <button
            className="admin-secondary-button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span>
            {page} of {query.data?.totalPages}
          </span>
          <button
            className="admin-secondary-button"
            disabled={page >= (query.data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}

      {selectedTransaction ? (
        <TransactionDialog
          record={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      ) : null}
      {createOpen ? <CreateReferralDialog onClose={() => setCreateOpen(false)} /> : null}
      {action ? <ReferralActionDialog {...action} onClose={() => setAction(null)} /> : null}
      {signupCode ? (
        <ReferralSignupsDialog record={signupCode} onClose={() => setSignupCode(null)} />
      ) : null}
    </main>
  );
}

function FinanceSummary({
  query,
  walletFlow,
}: {
  query: ReturnType<typeof useFinanceSummary>;
  walletFlow: ReturnType<typeof useWalletFlow>;
}) {
  if (query.isError)
    return (
      <FinanceState
        title="Financial summary is unavailable"
        copy={getErrorMessage(query.error, "The ledger remains available below.")}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <>
      <section
        className="finance-summary"
        aria-label="Financial summary"
        aria-busy={query.isLoading}
      >
        <article>
          <span>Total commission</span>
          <strong>
            {query.isLoading
              ? "—"
              : `${compactNumber.format(Number(query.data?.totalCommissionsGlk ?? 0))} GLK`}
          </strong>
          <small>Personal and team transfers</small>
        </article>
        <article>
          <span>Personal ledger</span>
          <strong>
            {query.isLoading
              ? "—"
              : compactNumber.format(query.data?.personalTransactionCount ?? 0)}
          </strong>
          <small>
            {compactNumber.format(Number(query.data?.userCommissionsGlk ?? 0))} GLK commission
          </small>
        </article>
        <article>
          <span>Team ledger</span>
          <strong>
            {query.isLoading ? "—" : compactNumber.format(query.data?.teamTransactionCount ?? 0)}
          </strong>
          <small>
            {compactNumber.format(Number(query.data?.teamCommissionsGlk ?? 0))} GLK commission
          </small>
        </article>
        <article>
          <span>Completed purchases</span>
          <strong>
            {query.isLoading
              ? "—"
              : compactNumber.format(
                  query.data?.purchases.reduce((sum, item) => sum + item.count, 0) ?? 0,
                )}
          </strong>
          <small>Across recorded currencies</small>
        </article>
        {query.data?.purchases.length ? (
          <div className="finance-purchases">
            <span>Completed purchases</span>
            {query.data.purchases.map((purchase) => (
              <strong key={purchase.currency}>
                {compactNumber.format(Number(purchase.fiatAmount))}{" "}
                {purchase.currency.toUpperCase()}{" "}
                <small>
                  → {compactNumber.format(Number(purchase.glkAmount))} GLK · {purchase.count}{" "}
                  payments
                </small>
              </strong>
            ))}
          </div>
        ) : null}
      </section>
      <section className="finance-analytics-grid" aria-label="Financial trends">
        <article className="finance-analytics">
          <header>
            <div>
              <span className="admin-eyebrow">Commission history</span>
              <strong>GLK earned through transfers.</strong>
            </div>
            <small>Trailing 12 months</small>
          </header>
          {query.isLoading ? (
            <i className="finance-analytics__skeleton" />
          ) : (
            <LineChart
              data={query.data?.monthlyCommissions ?? []}
              series={[{ key: "amount", label: "Commission", color: "#c5a2fe" }]}
              valueSuffix=" GLK"
            />
          )}
        </article>
        <article className="finance-analytics">
          <header>
            <div>
              <span className="admin-eyebrow">Wallet movement</span>
              <strong>Completed incoming and outgoing GLK.</strong>
            </div>
            <small>Year to date</small>
          </header>
          {walletFlow.isLoading ? (
            <i className="finance-analytics__skeleton" />
          ) : walletFlow.isError ? (
            <p className="finance-analytics__empty">Wallet movement is unavailable.</p>
          ) : (
            <BarChart
              data={walletFlow.data ?? []}
              series={[
                { key: "revenue", label: "Incoming", color: "#65c99a" },
                { key: "expenses", label: "Outgoing", color: "#c5a2fe" },
              ]}
              valueSuffix=" GLK"
            />
          )}
        </article>
      </section>
    </>
  );
}

function LedgerRow({
  record,
  onOpen,
}: {
  record: LedgerRecord;
  onOpen: (record: LedgerRecord) => void;
}) {
  return (
    <button className="finance-row" onClick={() => onOpen(record)}>
      <span>
        <strong>{record.owner}</strong>
        <small>
          {record.scope} wallet · {record.id.slice(0, 8)}
        </small>
      </span>
      <span>
        <strong>{record.type.replace(/_/g, " ")}</strong>
        <small>{dateTime.format(new Date(record.createdAt))}</small>
      </span>
      <span>
        <strong>
          {compactNumber.format(Number(record.amount))} {record.unit}
        </strong>
        <small>
          {record.purchasedGlk
            ? `${compactNumber.format(Number(record.purchasedGlk))} GLK purchased`
            : Number(record.commission)
              ? `${record.commission} GLK commission`
              : "No commission"}
        </small>
      </span>
      <em data-status={record.status.toLowerCase()}>{record.status.toLowerCase()}</em>
    </button>
  );
}

function ReferralRow({
  record,
  onAction,
  onSignups,
}: {
  record: ReferralCodeRecord;
  onAction: (kind: "status" | "delete") => void;
  onSignups: () => void;
}) {
  const expired = Boolean(record.expiresAt && new Date(record.expiresAt) <= new Date());
  return (
    <div className="finance-row">
      <span>
        <strong>{record.code}</strong>
        <small>{record.source}</small>
      </span>
      <span>
        <button className="finance-signups-link" onClick={onSignups}>
          {record.signups} signups
        </button>
        <small>{record.rewarded} rewarded</small>
      </span>
      <span>
        <strong>
          {record.expiresAt ? dateTime.format(new Date(record.expiresAt)) : "No expiry"}
        </strong>
        <small>Created {dateTime.format(new Date(record.createdAt))}</small>
      </span>
      <div className="finance-row__actions">
        <em data-status={expired ? "expired" : record.isActive ? "active" : "inactive"}>
          {expired ? "expired" : record.isActive ? "active" : "inactive"}
        </em>
        <button onClick={() => onAction("status")}>
          {record.isActive ? "Deactivate" : "Activate"}
        </button>
        {record.signups === 0 ? <button onClick={() => onAction("delete")}>Delete</button> : null}
      </div>
    </div>
  );
}

function ReferralSignupsDialog({
  record,
  onClose,
}: {
  record: ReferralCodeRecord;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useReferralSignups(record.id, page, term);
  return (
    <div
      className="admin-dialog finance-signups-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={`${record.code} signups`}
    >
      <form onSubmit={(event) => event.preventDefault()}>
        <header>
          <span className="admin-eyebrow">Referral attribution</span>
          <h2>{record.code} signups</h2>
          <p>Only the identity and reward context needed for programme review is exposed.</p>
        </header>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search player or email"
        />
        {query.isError ? (
          <p role="alert">{getErrorMessage(query.error, "Signups could not be loaded.")}</p>
        ) : query.isLoading ? (
          <div className="finance-signup-list" aria-busy="true">
            <i className="finance-skeleton" />
            <i className="finance-skeleton" />
          </div>
        ) : !query.data?.data.length ? (
          <FinanceState
            title="No attributed signups"
            copy="Players who join with this code will appear here."
          />
        ) : (
          <div className="finance-signup-list">
            {query.data.data.map((signup) => (
              <div key={signup.id}>
                <AdminAvatar name={signup.username} src={signup.profileImage} />
                <span>
                  <strong>{signup.username}</strong>
                  <small>{signup.email}</small>
                </span>
                <span>
                  <strong>{signup.status}</strong>
                  <small>{signup.rewardPoints} reward points</small>
                </span>
              </div>
            ))}
          </div>
        )}
        <footer>
          <span>{query.data ? `${page} of ${Math.max(query.data.totalPages, 1)}` : ""}</span>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={page >= (query.data?.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
          <button type="button" className="admin-primary-button" onClick={onClose}>
            Done
          </button>
        </footer>
      </form>
    </div>
  );
}

function FinanceState({
  title,
  copy,
  onRetry,
}: {
  title: string;
  copy: string;
  onRetry?: () => void;
}) {
  return (
    <section className="finance-state">
      <h2>{title}</h2>
      <p>{copy}</p>
      {onRetry ? (
        <button className="admin-secondary-button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

function TransactionDialog({ record, onClose }: { record: LedgerRecord; onClose: () => void }) {
  return (
    <div className="admin-dialog" role="dialog" aria-modal="true" aria-label="Transaction details">
      <form onSubmit={(event) => event.preventDefault()}>
        <header>
          <span className="admin-eyebrow">Ledger record</span>
          <h2>{record.type.replace(/_/g, " ")}</h2>
          <p>{record.id}</p>
        </header>
        <dl className="finance-details">
          <div>
            <dt>Owner</dt>
            <dd>{record.owner}</dd>
          </div>
          <div>
            <dt>Wallet</dt>
            <dd>{record.scope}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>
              {record.amount} {record.unit}
            </dd>
          </div>
          {record.purchasedGlk ? (
            <div>
              <dt>Purchased tokens</dt>
              <dd>{record.purchasedGlk} GLK</dd>
            </div>
          ) : null}
          <div>
            <dt>Commission</dt>
            <dd>{record.commission} GLK</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{record.status}</dd>
          </div>
          <div>
            <dt>Recorded</dt>
            <dd>{dateTime.format(new Date(record.createdAt))}</dd>
          </div>
        </dl>
        <footer>
          <button className="admin-secondary-button" onClick={onClose}>
            Close
          </button>
        </footer>
      </form>
    </div>
  );
}

function CreateReferralDialog({ onClose }: { onClose: () => void }) {
  const mutation = useCreateReferralCode();
  const [input, setInput] = useState<ReferralInput>({
    code: "",
    source: "",
    expiresAt: "",
    reason: "",
  });
  const valid =
    input.code.trim().length >= 3 &&
    input.source.trim().length >= 2 &&
    input.reason.trim().length >= 5;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    mutation.mutate(
      {
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : undefined,
      },
      { onSuccess: onClose },
    );
  };
  return (
    <div
      className="admin-dialog finance-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Create referral code"
    >
      <form onSubmit={submit}>
        <header>
          <span className="admin-eyebrow">Growth programme</span>
          <h2>Create referral code</h2>
          <p>
            Codes are normalized to uppercase and every creation records the administrator’s reason.
          </p>
        </header>
        <label>
          Code
          <input
            value={input.code}
            onChange={(event) => setInput({ ...input, code: event.target.value.toUpperCase() })}
            maxLength={50}
            placeholder="PARTNER2026"
          />
        </label>
        <label>
          Source
          <input
            value={input.source}
            onChange={(event) => setInput({ ...input, source: event.target.value })}
            maxLength={255}
            placeholder="Partner or campaign name"
          />
        </label>
        <label>
          Expiry (optional)
          <input
            type="datetime-local"
            value={input.expiresAt}
            onChange={(event) => setInput({ ...input, expiresAt: event.target.value })}
          />
        </label>
        <label>
          Audit reason
          <textarea
            value={input.reason}
            onChange={(event) => setInput({ ...input, reason: event.target.value })}
            maxLength={500}
            placeholder="Why is this code being created?"
          />
        </label>
        {mutation.isError ? (
          <p role="alert">{getErrorMessage(mutation.error, "The code could not be created.")}</p>
        ) : null}
        <footer>
          <button type="button" className="admin-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="admin-primary-button" disabled={!valid || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create code"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function ReferralActionDialog({
  record,
  kind,
  onClose,
}: {
  record: ReferralCodeRecord;
  kind: "status" | "delete";
  onClose: () => void;
}) {
  const status = useUpdateReferralStatus();
  const remove = useDeleteReferralCode();
  const mutation = kind === "delete" ? remove : status;
  const [reason, setReason] = useState("");
  const next = record.isActive ? "inactive" : "active";
  const title =
    kind === "delete"
      ? `Delete ${record.code}?`
      : `${next === "active" ? "Activate" : "Deactivate"} ${record.code}?`;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) return;
    if (kind === "delete") remove.mutate({ id: record.id, reason }, { onSuccess: onClose });
    else status.mutate({ id: record.id, status: next, reason }, { onSuccess: onClose });
  };
  return (
    <div className="admin-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <form onSubmit={submit}>
        <header>
          <span className="admin-eyebrow">Audited action</span>
          <h2>{title}</h2>
          <p>
            {kind === "delete"
              ? "Deletion is only allowed before any signup is attributed. This cannot be undone."
              : "The status change takes effect immediately and is recorded in the audit history."}
          </p>
        </header>
        <label>
          Reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
          />
        </label>
        {mutation.isError ? (
          <p role="alert">
            {getErrorMessage(mutation.error, "This action could not be completed.")}
          </p>
        ) : null}
        <footer>
          <button type="button" className="admin-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="admin-primary-button"
            disabled={reason.trim().length < 5 || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Confirm"}
          </button>
        </footer>
      </form>
    </div>
  );
}
