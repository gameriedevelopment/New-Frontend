import { Eye, TrendingUp, Users } from "lucide-react";
import type { FeedPost } from "../types";

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function PostOwnerInsights({ post }: { post: FeedPost }) {
  const views = Number(post.analytics?.views ?? post.viewCount ?? 0);
  const reach = Array.isArray(post.analytics?.uniqueViews) ? post.analytics.uniqueViews.length : 0;
  const engagement = Number(post.analytics?.engagementRate ?? 0);
  if (!views && !reach && !engagement) return null;

  return <aside className="post-insights" aria-label="Post performance">
    <header><span>Post performance</span><small>Visible only to you</small></header>
    <dl>
      <div><dt><Eye size={15} />Views</dt><dd>{formatMetric(views)}</dd></div>
      <div><dt><Users size={15} />Reach</dt><dd>{formatMetric(reach)}</dd></div>
      <div><dt><TrendingUp size={15} />Engagement</dt><dd>{engagement.toFixed(1)}%</dd></div>
    </dl>
  </aside>;
}
