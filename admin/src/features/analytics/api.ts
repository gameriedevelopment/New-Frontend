import { api } from "../../lib/api";
import type { Envelope } from "../dashboard/types";
import type { AnalyticsRange, PostAnalytics } from "./types";

export async function getPostAnalytics(range: AnalyticsRange) {
  const { data } = await api.get<Envelope<PostAnalytics>>("/admin/post-analytics", {
    params: { filter: range },
  });
  return data.data;
}
