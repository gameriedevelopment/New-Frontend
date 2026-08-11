import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope, DirectoryQuery } from "../../lib/contracts";
import type {
  FinanceSummary,
  LedgerQuery,
  LedgerRecord,
  ReferralCodeRecord,
  ReferralInput,
  ReferralQuery,
  ReferralSignupRecord,
  WalletFlowPoint,
} from "./types";

export async function getFinanceSummary() {
  const { data } = await api.get<ApiEnvelope<FinanceSummary>>("/admin/finance/summary");
  return data.data;
}

export async function getWalletFlow() {
  const { data } = await api.get<ApiEnvelope<WalletFlowPoint[]>>("/admin/revenue-data");
  return data.data;
}

export async function getFinanceTransactions(query: LedgerQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<LedgerRecord>>>(
    "/admin/finance/transactions",
    { params: query },
  );
  return data.data;
}

export async function getReferralCodes(query: ReferralQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<ReferralCodeRecord>>>(
    "/admin/growth/referrals",
    { params: query },
  );
  return data.data;
}

export async function createReferralCode(input: ReferralInput) {
  const { data } = await api.post<ApiEnvelope<ReferralCodeRecord>>(
    "/admin/growth/referrals",
    input,
  );
  return data.data;
}

export async function updateReferralStatus(
  id: string,
  status: "active" | "inactive",
  reason: string,
) {
  const { data } = await api.patch<ApiEnvelope<ReferralCodeRecord>>(
    `/admin/growth/referrals/${id}/status`,
    { status, reason },
  );
  return data.data;
}

export async function deleteReferralCode(id: string, reason: string) {
  await api.delete(`/admin/growth/referrals/${id}`, { data: { reason } });
}

export async function getReferralSignups(id: string, query: DirectoryQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<ReferralSignupRecord>>>(
    `/admin/growth/referrals/${id}/signups`,
    { params: query },
  );
  return data.data;
}
