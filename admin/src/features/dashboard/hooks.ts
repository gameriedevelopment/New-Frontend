import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics, getPlatformStats, getUserGrowth } from "./api";

export function useDashboardMetrics() {
  return useQuery({ queryKey: ["admin", "dashboard", "metrics"], queryFn: getDashboardMetrics });
}

export function useDashboardAnalytics() {
  const growth = useQuery({ queryKey: ["admin", "dashboard", "growth"], queryFn: getUserGrowth });
  const platforms = useQuery({
    queryKey: ["admin", "dashboard", "platforms"],
    queryFn: getPlatformStats,
  });
  return { growth, platforms };
}
