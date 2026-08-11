import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFlaggedComments,
  getFlaggedPosts,
  getModerationReports,
  getReportAudit,
  removeFlaggedContent,
  updateReportStatus,
} from "./api";
import type { ReportQuery, ReportStatus } from "./types";

export function useModerationReports(query: ReportQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "moderation", "reports", query],
    queryFn: () => getModerationReports(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRemoveFlaggedContent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, reason }: { kind: "post" | "comment"; id: string; reason: string }) =>
      removeFlaggedContent(kind, id, reason),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "moderation"] });
    },
  });
}

export function useFlaggedPosts(page: number, enabled = true) {
  return useQuery({
    queryKey: ["admin", "moderation", "flagged-posts", page],
    queryFn: () => getFlaggedPosts(page),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useFlaggedComments(page: number, enabled = true) {
  return useQuery({
    queryKey: ["admin", "moderation", "flagged-comments", page],
    queryFn: () => getFlaggedComments(page),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useReportAudit(reportId?: string) {
  return useQuery({
    queryKey: ["admin", "moderation", "report-audit", reportId],
    queryFn: () => getReportAudit(reportId!),
    enabled: Boolean(reportId),
  });
}

export function useReviewReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: Exclude<ReportStatus, "pending">;
      notes: string;
    }) => updateReportStatus(id, status, notes),
    onSuccess: (_report, input) => {
      void client.invalidateQueries({ queryKey: ["admin", "moderation", "reports"] });
      void client.invalidateQueries({
        queryKey: ["admin", "moderation", "report-audit", input.id],
      });
    },
  });
}
