import { Link } from "react-router-dom";
import { SafeImage } from "../../../components/ui";
import type { FeedPost } from "../types";
import { RichText } from "./RichText";

function originalIdentity(post: FeedPost) {
  const author = post.author ?? post.user;
  return {
    name: author?.displayName ?? author?.username ?? post.authorName ?? "Gamerie player",
    image: author?.profilePictureUrl ?? author?.profileImage ?? post.authorImage,
  };
}

export function RepostEmbed({ post }: { post: FeedPost }) {
  const author = originalIdentity(post);
  const media = post.media?.[0] ?? post.mediaUrl;
  const href = `/post/${post.id}${post.hubId ? `?hub=${post.hubId}` : post.teamId ? `?team=${post.teamId}` : ""}`;
  return (
    <Link className="repost-embed" to={href}>
      <header>
        <SafeImage src={author.image} alt="" />
        <strong>{author.name}</strong>
        <span>Original post</span>
      </header>
      {post.content ? <RichText className="repost-embed__content" content={post.content} /> : null}
      {media ? (
        <SafeImage
          className="repost-embed__media"
          src={media}
          fallback="/media-fallback.svg"
          alt="Original post media"
        />
      ) : null}
    </Link>
  );
}
