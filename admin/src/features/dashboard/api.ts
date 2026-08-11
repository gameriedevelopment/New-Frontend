import { api } from "../../lib/api";
import type { DashboardMetrics, Envelope } from "./types";

export async function getDashboardMetrics() {
  const { data } = await api.get<Envelope<DashboardMetrics>>("/admin/dashboard-metrics");
  return data.data;
}
