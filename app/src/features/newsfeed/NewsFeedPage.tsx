import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, StatePanel } from "../../components/ui";
import { FeedComposer } from "./components/FeedComposer";
import { FeedPostCard } from "./components/FeedPostCard";
import { FeedSkeleton } from "./components/FeedSkeleton";
import { TrendingRail } from "./components/TrendingRail";
import { useFeedPosts } from "./hooks";
import type { FeedFilter } from "./types";

const filters: Array<{ value: FeedFilter; label: string }> = [
  { value: "all", label: "For you" },
  { value: "following", label: "Following" },
  { value: "teams", label: "Teams" },
];

export function NewsFeedPage() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const query = useFeedPosts(filter);
  const sentinel = useRef<HTMLDivElement>(null);
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !query.hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !query.isFetchingNextPage) query.fetchNextPage();
    }, { rootMargin: "280px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return <div className="feed-page">
    <div className="feed-main">
      <header className="feed-heading">
        <div><p>Community</p><h1>Your feed</h1></div>
        <nav aria-label="Feed filters">{filters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "is-active" : undefined} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</nav>
      </header>
      <FeedComposer />
      <section className="feed-stream" aria-label="Posts">
        {query.isLoading ? <FeedSkeleton /> : null}
        {query.isError ? <StatePanel tone="error" icon={<AlertCircle size={19} />} title="The feed could not load" description="We could not reach Gamerie right now. Your account and content are safe." action={<Button variant="secondary" onClick={() => query.refetch()}><RefreshCw size={15} />Try again</Button>} /> : null}
        {!query.isLoading && !query.isError && !posts.length ? <StatePanel title={filter === "all" ? "The community is quiet" : `Nothing in ${filters.find((item) => item.value === filter)?.label.toLowerCase()} yet`} description={filter === "all" ? "Start the first conversation or check back shortly." : "Follow more players and teams, or switch to For you."} /> : null}
        {posts.map((post) => <FeedPostCard post={post} key={post.id} />)}
        <div ref={sentinel} className="feed-sentinel" aria-hidden="true" />
        {query.isFetchingNextPage ? <FeedSkeleton count={1} label="Loading more posts" /> : null}
        {query.hasNextPage && !query.isFetchingNextPage ? <div className="feed-more"><button type="button" onClick={() => query.fetchNextPage()}>Load more posts</button></div> : null}
        {!query.hasNextPage && posts.length ? <p className="feed-end">You’re all caught up.</p> : null}
      </section>
    </div>
    <TrendingRail />
  </div>;
}
