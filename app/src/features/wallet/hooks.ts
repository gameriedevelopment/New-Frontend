import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  getWallet,
  getWalletInsights,
  getWalletTransactions,
  purchaseTokens,
  setDefaultPaymentMethod,
  transferPersonalTokens,
} from "./api";
import type { WalletTransactionFilters } from "./types";

export function useWallet() {
  return useQuery({ queryKey: ["wallet", "personal"], queryFn: getWallet, staleTime: 20_000 });
}

export function useWalletInsights() {
  return useQuery({
    queryKey: ["wallet", "insights"],
    queryFn: getWalletInsights,
    staleTime: 30_000,
  });
}

export function useWalletTransactions(filters: WalletTransactionFilters) {
  return useInfiniteQuery({
    queryKey: ["wallet", "transactions", filters],
    queryFn: ({ pageParam }) => getWalletTransactions(filters, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 20_000,
  });
}

export function useTransferPersonalTokens() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: transferPersonalTokens,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["wallet"] });
      void client.invalidateQueries({ queryKey: ["team-wallet"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: ["notification-menu"] });
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["wallet", "payment-methods"],
    queryFn: getPaymentMethods,
    staleTime: 30_000,
  });
}

export function useAddPaymentMethod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["wallet", "payment-methods"] }),
  });
}

export function useSetDefaultPaymentMethod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["wallet", "payment-methods"] }),
  });
}

export function useDeletePaymentMethod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["wallet", "payment-methods"] }),
  });
}

export function usePurchaseTokens() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: purchaseTokens,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["wallet"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
