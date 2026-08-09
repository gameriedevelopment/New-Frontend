import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button, StatePanel } from "../../components/ui";
import { trackPostView } from "./api";
import { CommentSection } from "./components/CommentSection";
import { FeedPostCard } from "./components/FeedPostCard";
import { FeedSkeleton } from "./components/FeedSkeleton";
import { PostOwnerInsights } from "./components/PostOwnerInsights";
import { useHubPostContext, useSinglePost } from "./hooks";
import { useAuthStore } from "../auth/authStore";
import type { PostOwnerType } from "./types";

export function SinglePostPage() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get("team") || undefined;
  const hubId = searchParams.get("hub") || undefined;
  const query = useSinglePost(postId, teamId, hubId);
  const user = useAuthStore((state) => state.user);
  const resolvedType: PostOwnerType = hubId || query.data?.hubId ? "hub" : teamId || query.data?.teamId ? "team" : "user";
  const resolvedHubId = hubId ?? query.data?.hubId;
  const hubContext = useHubPostContext(resolvedHubId);
  const canDeleteAsHubOwner = Boolean(user?.id && hubContext.data?.ownerId === user.id);
  const isPostAuthor = Boolean(user?.id && user.id === String(query.data?.authorId ?? query.data?.author?.id ?? query.data?.userId ?? query.data?.user?.id ?? ""));

  useEffect(() => {
    if (!postId) return;
    trackPostView(postId).catch(() => undefined);
  }, [postId]);

  return <div className="single-post-page">
    <header className="single-post-page__header"><Link to="/feed"><ArrowLeft size={16} />Back to feed</Link><div><p>Community post</p><h1>Conversation</h1></div></header>
    {query.isLoading ? <FeedSkeleton /> : null}
    {query.isError || (!query.isLoading && !query.data) ? <StatePanel tone="error" icon={<AlertCircle size={19} />} title="This post is unavailable" description="It may have been removed, or Gamerie could not load it right now." action={<Button variant="secondary" onClick={() => query.refetch()}><RefreshCw size={15} />Try again</Button>} /> : null}
    {query.data ? <><FeedPostCard post={query.data} single canDeleteOverride={canDeleteAsHubOwner} />{isPostAuthor ? <PostOwnerInsights post={query.data} /> : null}<CommentSection post={query.data} type={resolvedType} /></> : null}
  </div>;
}
