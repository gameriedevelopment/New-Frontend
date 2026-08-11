import { api } from "../../lib/api";
import type { ApiEnvelope } from "../../lib/contracts";
import type { AdminAnnouncement, AnnouncementPage, BrevoRunReceipt } from "./types";

export async function getAnnouncements(cursor?: string) {
  const { data } = await api.get<ApiEnvelope<AnnouncementPage>>("/admin/posts", {
    params: { cursor, limit: 12 },
  });
  return data.data;
}

export async function publishAnnouncement(content: string, reason: string) {
  const { data } = await api.post<ApiEnvelope<AdminAnnouncement>>("/admin/announcements", {
    content,
    reason,
  });
  return data.data;
}

export async function runBrevoResync(input: {
  dryRun: boolean;
  reason: string;
  confirmation?: string;
}) {
  const { data } = await api.post<ApiEnvelope<BrevoRunReceipt>>("/admin/brevo/resync", input);
  return data.data;
}
