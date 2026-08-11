import { useQuery } from "@tanstack/react-query";
import { getPostAnalytics } from "./api";
import type { AnalyticsRange } from "./types";

export function usePostAnalytics(range: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "analytics", "content", range],
    queryFn: () => getPostAnalytics(range),
  });
}
