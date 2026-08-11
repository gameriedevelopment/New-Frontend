import { api } from "../../lib/api";
import type {
  PaymentMethod,
  TransferReceipt,
  Wallet,
  WalletInsights,
  WalletTransaction,
  WalletTransactionFilters,
  WalletTransactionPage,
} from "./types";

interface Envelope<T> {
  data: T;
}

export async function getWallet(): Promise<Wallet> {
  const { data } = await api.get<Envelope<Wallet>>("/wallet/user-wallet");
  return data.data;
}

export async function getWalletInsights(): Promise<WalletInsights> {
  const { data } = await api.get<Envelope<WalletInsights>>("/wallet/wallet-insights");
  return data.data;
}

export async function getWalletTransactions(
  filters: WalletTransactionFilters,
  page = 1,
  perPage = 20,
): Promise<WalletTransactionPage> {
  const { data } = await api.get<Envelope<Omit<WalletTransactionPage, "page">>>(
    "/wallet/wallet-transactions",
    {
      params: { ...filters, page, perPage },
    },
  );
  return { ...data.data, page };
}

export async function transferPersonalTokens(payload: {
  amount: number;
  recipientUserId?: string;
  teamId?: string;
  idempotencyKey: string;
}): Promise<TransferReceipt> {
  const { idempotencyKey, recipientUserId, teamId, amount } = payload;
  const { data } = await api.post<Envelope<TransferReceipt>>(
    "/wallet/transfer/user",
    {
      amount,
      recipentUserId: recipientUserId,
      teamId,
    },
    { headers: { "x-idempotency-key": idempotencyKey } },
  );
  return data.data;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await api.get<Envelope<PaymentMethod[]>>("/wallet/user-paymentMethods");
  return data.data;
}

export async function addPaymentMethod(payload: {
  paymentMethodToken: string;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  const { data } = await api.post<Envelope<PaymentMethod>>("/wallet/payment-methods", payload);
  return data.data;
}

export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
  const { data } = await api.patch<Envelope<PaymentMethod>>(
    `/wallet/user-paymentMethods/${id}/set-default`,
  );
  return data.data;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await api.delete(`/wallet/user-paymentMethods/${id}`);
}

export async function purchaseTokens(payload: {
  amount: number;
  currency: "USD" | "EUR";
  paymentMethodId: string;
  idempotencyKey: string;
}): Promise<WalletTransaction> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await api.post<Envelope<WalletTransaction>>("/wallet/purchase-tokens", body, {
    headers: { "x-idempotency-key": idempotencyKey },
  });
  return data.data;
}
