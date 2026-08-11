import type { AdminPage } from "../../lib/contracts";

export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportKind = "spam" | "harassment" | "inappropriate" | "other";

export interface ReportedEntity {
  id: string;
  content?: string;
  username?: string;
  name?: string;
  authorName?: string;
  reportCount?: number;
  createdAt?: string;
}

export interface ModerationReport {
  id: string;
  contentId: string;
  contentType: string;
  contentAuthorId: string;
  reporterId: string;
  type: ReportKind;
  reason: string;
  status: ReportStatus;
  moderatorNotes?: string | null;
  entity?: ReportedEntity | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportAuditEntry {
  id: string;
  reportId: string;
  action: "created" | "status_changed" | "deleted";
  actorId?: string | null;
  previousStatus?: string | null;
  nextStatus?: string | null;
  metadata?: { moderatorNotes?: string; [key: string]: unknown } | null;
  createdAt: string;
}

export interface FlaggedPost {
  id: string;
  authorId?: string;
  authorName?: string;
  content: string;
  reportCount: number;
  lastReportedAt?: string | null;
  createdAt: string;
}

export interface FlaggedComment extends FlaggedPost {
  post?: { id: string } | null;
}

export interface ModerationRemovalReceipt {
  auditId: string;
  targetId: string;
  targetType: "post" | "comment";
  message: string;
}

export interface ReportsPage {
  data: ModerationReport[];
  total: number;
  totalPages: number;
}

export type FlaggedPage<T> = AdminPage<T>;

export interface ReportQuery {
  page: number;
  perPage: number;
  search?: string;
  status?: ReportStatus;
  type?: ReportKind;
  contentType?: string;
}
