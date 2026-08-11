import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReferralCode,
  deleteReferralCode,
  getFinanceSummary,
  getFinanceTransactions,
  getWalletFlow,
  getReferralCodes,
  getReferralSignups,
  updateReferralStatus,
} from "./api";
import type { LedgerQuery, ReferralInput, ReferralQuery } from "./types";

export function useFinanceSummary(enabled = true) {
  return useQuery({
    queryKey: ["admin", "finance", "summary"],
    queryFn: getFinanceSummary,
    enabled,
  });
}
export function useWalletFlow(enabled = true) {
  return useQuery({
    queryKey: ["admin", "finance", "wallet-flow"],
    queryFn: getWalletFlow,
    enabled,
  });
}
export function useFinanceTransactions(query: LedgerQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "finance", "transactions", query],
    queryFn: () => getFinanceTransactions(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}
export function useReferralCodes(query: ReferralQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "growth", "referrals", query],
    queryFn: () => getReferralCodes(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}
function useRefreshReferrals() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["admin", "growth", "referrals"] });
}
export function useCreateReferralCode() {
  const refresh = useRefreshReferrals();
  return useMutation({
    mutationFn: (input: ReferralInput) => createReferralCode(input),
    onSuccess: refresh,
  });
}
export function useUpdateReferralStatus() {
  const refresh = useRefreshReferrals();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "active" | "inactive";
      reason: string;
    }) => updateReferralStatus(id, status, reason),
    onSuccess: refresh,
  });
}
export function useDeleteReferralCode() {
  const refresh = useRefreshReferrals();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteReferralCode(id, reason),
    onSuccess: refresh,
  });
}

export function useReferralSignups(id: string | undefined, page: number, search: string) {
  return useQuery({
    queryKey: ["admin", "growth", "referrals", id, "signups", page, search],
    queryFn: () => getReferralSignups(id!, { page, limit: 15, search: search || undefined }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}
