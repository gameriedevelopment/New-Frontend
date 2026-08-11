import { api } from "../../lib/api";
import type { AdminPage, ApiEnvelope } from "../../lib/contracts";
import type { AdminAuditQuery, AdminAuditRecord } from "./types";

export async function getAuditHistory(query: AdminAuditQuery) {
  const { data } = await api.get<ApiEnvelope<AdminPage<AdminAuditRecord>>>("/admin/audit-logs", {
    params: query,
  });
  return data.data;
}
