import { TrendingUp } from "lucide-react";
import { useTrendingTopics } from "../hooks";

export function TrendingRail() {
  const query = useTrendingTopics();
  return <aside className="feed-context" aria-label="Feed context">
    <section>
      <header><span>Trending now</span><TrendingUp size={16} /></header>
      {query.isLoading ? <div className="feed-context__loading"><i /><i /><i /></div> : null}
      {query.isError ? <p className="feed-context__muted">Trending topics are unavailable right now.</p> : null}
      {query.data?.length ? <ol>{query.data.slice(0, 5).map((topic, index) => {
        const label = topic.tag ?? topic.topic ?? "Topic";
        const count = topic.count ?? topic.postCount ?? topic.commentCount;
        return <li key={topic.id ?? `${label}-${index}`}><span>{label.startsWith("#") ? label : `#${label}`}</span>{typeof count === "number" ? <small>{count.toLocaleString()} posts</small> : null}</li>;
      })}</ol> : null}
      {!query.isLoading && !query.isError && !query.data?.length ? <p className="feed-context__muted">Conversations will appear here as the community gets active.</p> : null}
    </section>
    <p className="feed-context__note">Your feed follows the people, teams, and spaces you choose.</p>
  </aside>;
}
