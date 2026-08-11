import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAuditHistory } from "./api";
import type { AdminAuditQuery } from "./types";

export function useAuditHistory(query: AdminAuditQuery) {
  return useQuery({
    queryKey: ["admin", "audit", query],
    queryFn: () => getAuditHistory(query),
    placeholderData: keepPreviousData,
  });
}
