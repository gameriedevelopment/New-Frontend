import { ArrowDownLeft, ArrowUpRight, Clock3, ShieldCheck, XCircle } from "lucide-react";
import type { WalletTransaction } from "../types";
import { formatToken, transactionDirection, transactionLabels } from "../utils";

export function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const direction = transactionDirection(transaction);
  const date = new Date(transaction.timestamp || transaction.createdAt || "");
  const StatusIcon =
    transaction.status === "COMPLETED"
      ? ShieldCheck
      : transaction.status === "FAILED"
        ? XCircle
        : Clock3;
  return (
    <article className="wallet-transaction" data-direction={direction}>
      <span className="wallet-transaction__icon" aria-hidden="true">
        {direction === "in" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
      </span>
      <div className="wallet-transaction__identity">
        <strong>{transactionLabels[transaction.type]}</strong>
        <span>
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
        </span>
      </div>
      <div className="wallet-transaction__amount">
        <strong>
          {direction === "in" ? "+" : "−"}
          {formatToken(
            transaction.metadata?.transferAmount ??
              transaction.metadata?.glkAmount ??
              transaction.amount,
          )}{" "}
          GLK
        </strong>
        <span data-status={transaction.status.toLowerCase()}>
          <StatusIcon size={12} />
          {transaction.status.toLowerCase()}
        </span>
      </div>
    </article>
  );
}
