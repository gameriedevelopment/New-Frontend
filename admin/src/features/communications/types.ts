export interface AdminAnnouncement {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AnnouncementPage {
  posts: AdminAnnouncement[];
  nextCursor: string | null;
}

export interface BrevoRunReceipt {
  total: number;
  valid: number;
  duplicatesSkipped: number;
  synced: number;
  failed: number;
  dryRun: boolean;
  auditId: string;
}
