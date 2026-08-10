import { Heart, Megaphone, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { notifyPostLike, trackPostView } from "../api";
import { useTogglePostLike, useToggleRepost } from "../hooks";
import type { FeedPost } from "../types";
import { PostActionMenu } from "./PostActionMenu";
import { RepostDialog } from "./RepostDialog";
import { RepostEmbed } from "./RepostEmbed";
import { PostContent } from "./PostContent";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { PostMediaGallery } from "./PostMediaGallery";

function timeAgo(value?: string) {
  if (!value) return "Recently";
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Recently";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function identity(post: FeedPost) {
  const author = post.author ?? post.user;
  return {
    id: String(author?.id ?? post.authorId ?? post.userId ?? ""),
    name: author?.displayName ?? author?.username ?? post.authorName ?? "Gamerie player",
    username: author?.username ?? post.authorName,
    image: author?.profilePictureUrl ?? author?.profileImage ?? post.authorImage,
  };
}

function totalLikes(post: FeedPost) {
  if (typeof post.likesCount === "number") return post.likesCount;
  return Object.values(post.reactionCounts ?? {}).reduce((sum, count) => sum + Number(count || 0), 0);
}

function mediaFor(post: FeedPost) {
  const media = Array.isArray(post.media) ? post.media.filter(Boolean) : [];
  return post.mediaUrl ? [...media, post.mediaUrl] : media;
}

export function FeedPostCard({ canDeleteOverride = false, post, single = false }: { canDeleteOverride?: boolean; post: FeedPost; single?: boolean }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const like = useTogglePostLike(post);
  const repost = useToggleRepost(post);
  const [repostOpen, setRepostOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<"copied" | "error" | null>(null);
  const postRef = useRef<HTMLElement>(null);
  const viewTracked = useRef(false);
  const author = identity(post);
  const media = mediaFor(post);
  const liked = Boolean(post.hasLiked ?? post.userReaction);
  const reposted = Boolean(post.hasReposted);
  const comments = Number(post.totalComments ?? post.commentsCount ?? post.commentCount ?? 0);
  const canRepost = !post.hubId && !(post.teamId && post.repostOf);
  const postHref = `/post/${post.id}${post.hubId ? `?hub=${post.hubId}` : post.teamId ? `?team=${post.teamId}` : ""}`;

  useEffect(() => {
    const node = postRef.current;
    if (!node || single) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || viewTracked.current) return;
      viewTracked.current = true;
      trackPostView(post.id).catch(() => undefined);
      observer.disconnect();
    }, { threshold: .5 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [post.id, single]);

  const toggleLike = async () => {
    const wasLiked = liked;
    try {
      await like.mutateAsync();
      const targetId = String(post.authorId ?? post.author?.id ?? post.userId ?? "");
      if (!wasLiked && user?.id && targetId && targetId !== user.id) notifyPostLike({ userId: user.id, targetId, contentType: "post", contentId: post.id }).catch(() => undefined);
    } catch { /* Optimistic state is rolled back by the mutation. */ }
  };

  const handleRepost = async () => {
    if (!reposted) { setRepostOpen(true); return; }
    try { await repost.mutateAsync(""); } catch { /* Optimistic state is rolled back. */ }
  };

  const sharePost = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${postHref}`); setShareStatus("copied"); }
    catch { setShareStatus("error"); }
    window.setTimeout(() => setShareStatus(null), 2200);
  };

  const openPost = (target: EventTarget | null) => {
    if (single || (target instanceof Element && target.closest("a, button, input, textarea, select, video"))) return;
    navigate(postHref);
  };

  return <article className="feed-post" ref={postRef} data-clickable={!single || undefined} onClick={(event) => openPost(event.target)}>
    <header className="feed-post__header">
      <Link className="feed-post__identity" to={author.username ? `/profile/${author.username}` : `/users/${author.id}`}>
        {author.image ? <SafeImage src={author.image} alt="" /> : <span className="feed-avatar">{author.name.slice(0, 2).toUpperCase()}</span>}
        <span><strong>{author.name}</strong>{author.username && author.username !== author.name ? <small>@{author.username}</small> : null}</span>
      </Link>
      {single ? <span className="feed-post__time">{timeAgo(post.createdAt)}</span> : <Link className="feed-post__time" to={postHref} aria-label="Open post conversation">{timeAgo(post.createdAt)}</Link>}
      <PostActionMenu post={post} single={single} canDeleteOverride={canDeleteOverride} />
    </header>
    {post.isAnnouncement ? <div className="feed-post__announcement"><Megaphone size={14} />Announcement</div> : null}
    {post.repostOf ? <div className="feed-post__repost"><span><Repeat2 size={14} />Reposted</span>{post.content ? <PostContent content={post.content} single={single} /> : null}<RepostEmbed post={post.repostOf} /></div> : post.content ? <><PostContent content={post.content} single={single} /><LinkPreviewCard content={post.content} /></> : null}
    {!post.repostOf && media.length ? <PostMediaGallery media={media} mediaType={post.mediaType} /> : null}
    <footer className="feed-post__actions" data-count={canRepost ? 4 : 3}>
      <button type="button" className={liked ? "is-active" : undefined} onClick={toggleLike} disabled={like.isPending} aria-label={liked ? "Unlike post" : "Like post"} aria-pressed={liked}><Heart size={18} fill={liked ? "currentColor" : "none"} /><span>{totalLikes(post) || "Like"}</span></button>
      {single ? <a href="#comments"><MessageCircle size={18} /><span>{comments || "Comment"}</span></a> : <Link to={postHref}><MessageCircle size={18} /><span>{comments || "Comment"}</span></Link>}
      {canRepost ? <button type="button" className={reposted ? "is-active" : undefined} disabled={repost.isPending} onClick={handleRepost} aria-pressed={reposted}><Repeat2 size={18} /><span>{post.repostsCount || "Repost"}</span></button> : null}
      <button type="button" onClick={sharePost}><Share2 size={18} /><span>{shareStatus === "copied" ? "Copied" : shareStatus === "error" ? "Try again" : "Share"}</span></button>
    </footer>
    {repostOpen ? <RepostDialog post={post} onClose={() => setRepostOpen(false)} /> : null}
  </article>;
}
