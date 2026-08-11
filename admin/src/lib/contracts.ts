export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export interface AdminPage<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DirectoryQuery {
  page?: number;
  limit?: number;
  search?: string;
}
