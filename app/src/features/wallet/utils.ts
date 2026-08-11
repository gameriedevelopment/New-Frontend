import type { WalletTransaction, WalletTransactionType } from "./types";

export const transactionLabels: Record<WalletTransactionType, string> = {
  PURCHASE: "GLK purchase",
  TRANSFER: "Sent GLK",
  REWARD: "Reward received",
  REDEEM: "Reward redeemed",
  WITHDRAWAL: "Withdrawal",
  INCOMING: "GLK received",
  CHALLENGE_RESERVE: "Challenge stake reserved",
  CHALLENGE_RELEASE: "Challenge stake released",
};

export function formatToken(value: number | string, maximumFractionDigits = 2) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(amount)
    : "0";
}

export function transactionDirection(transaction: WalletTransaction) {
  return ["PURCHASE", "REWARD", "INCOMING", "CHALLENGE_RELEASE"].includes(transaction.type)
    ? "in"
    : "out";
}

export function getTransferBreakdown(requested: number, available: number) {
  const valid = Number.isFinite(requested) && requested > 0 && requested <= available;
  const fee = valid ? Math.floor(requested * 0.02) : 0;
  return {
    valid,
    fee,
    received: valid ? requested - fee : 0,
    remaining: valid ? available - requested : available,
  };
}
