import type { DirectoryQuery } from "../../lib/contracts";

export interface AdminAuditRecord {
  id: string;
  actorId: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  requestId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminAuditQuery extends DirectoryQuery {
  targetType?: string;
  action?: string;
  from?: string;
  to?: string;
}
