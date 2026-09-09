import { api } from "../../lib/api";
import type { ApiEnvelope } from "../../lib/contracts";
import type {
  FlaggedComment,
  FlaggedPage,
  FlaggedPost,
  ModerationReport,
  ModerationRemovalReceipt,
  ReportAuditEntry,
  ReportContext,
  ReportQuery,
  ReportStatus,
  ReportsPage,
} from "./types";

export async function getModerationReports(query: ReportQuery) {
  const { data } = await api.get<ApiEnvelope<ReportsPage>>("/admin/reports", { params: query });
  return data.data;
}

export async function removeFlaggedContent(kind: "post" | "comment", id: string, reason: string) {
  const resource = kind === "post" ? "posts" : "comments";
  const { data } = await api.delete<ApiEnvelope<ModerationRemovalReceipt>>(
    `/admin/${resource}/${id}`,
    { data: { reason } },
  );
  return data.data;
}

export async function getFlaggedPosts(page: number, limit = 20) {
  const { data } = await api.get<ApiEnvelope<FlaggedPage<FlaggedPost>>>("/admin/flagged-posts", {
    params: { page, limit },
  });
  return data.data;
}

export async function getFlaggedComments(page: number, limit = 20) {
  const { data } = await api.get<ApiEnvelope<FlaggedPage<FlaggedComment>>>(
    "/admin/flagged-comments",
    { params: { page, limit } },
  );
  return data.data;
}

export async function getReportAudit(reportId: string) {
  const { data } = await api.get<ApiEnvelope<ReportAuditEntry[]>>(
    `/admin/reports/${reportId}/audit`,
  );
  return data.data;
}

export async function getReportContext(reportId: string) {
  const { data } = await api.get<ApiEnvelope<ReportContext>>(`/admin/reports/${reportId}/context`);
  return data.data;
}

export async function updateReportStatus(
  reportId: string,
  status: Exclude<ReportStatus, "pending">,
  moderatorNotes: string,
) {
  const { data } = await api.patch<ApiEnvelope<ModerationReport>>(
    `/admin/reports/${reportId}/status`,
    { status, moderatorNotes },
  );
  return data.data;
}
