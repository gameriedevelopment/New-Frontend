import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "./api";

export function useDashboardMetrics() {
  return useQuery({ queryKey: ["admin", "dashboard", "metrics"], queryFn: getDashboardMetrics });
}
