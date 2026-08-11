import { api } from "../../lib/api";
import type { DashboardMetrics, Envelope, PlatformStat, UserGrowthPoint } from "./types";

export async function getDashboardMetrics() {
  const { data } = await api.get<Envelope<DashboardMetrics>>("/admin/dashboard-metrics");
  return data.data;
}

export async function getUserGrowth() {
  const { data } = await api.get<Envelope<UserGrowthPoint[]>>("/admin/user-growth");
  return data.data;
}

export async function getPlatformStats() {
  const { data } = await api.get<Envelope<PlatformStat[]>>("/admin/platform-stats");
  return data.data;
}
