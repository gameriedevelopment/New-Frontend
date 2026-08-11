import { MessageCircle, RefreshCw, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, SafeImage, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { notifyPostComment } from "../api";
import { useAddComment, usePostComments } from "../hooks";
import type { FeedComment, FeedPost, PostOwnerType } from "../types";
import { CommentItem } from "./CommentItem";
import { RichPostEditor } from "./RichPostEditor";

function replyName(comment: FeedComment) {
  return comment.author?.displayName ?? comment.author?.username ?? comment.authorName ?? "player";
}

export function CommentSection({ post, type }: { post: FeedPost; type: PostOwnerType }) {
  const user = useAuthStore((state) => state.user);
  const query = usePostComments(post.id, type);
  const add = useAddComment();
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<FeedComment | null>(null);
  const comments = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      ),
    [query.data],
  );

  if (!user) return null;

  const submit = async () => {
    const clean = content.trim();
    if (!clean || clean.length > 2000) return;
    try {
      await add.mutateAsync({
        postId: post.id,
        content: clean,
        parentCommentId: replyingTo?.id ?? null,
        type,
      });
      setContent("");
      setReplyingTo(null);
      const targetId = String(post.authorId ?? post.author?.id ?? post.userId ?? "");
      if (targetId && targetId !== user.id)
        notifyPostComment({
          userId: user.id,
          targetId,
          contentType: "post",
          contentId: post.id,
        }).catch(() => undefined);
    } catch {
      /* Error remains next to composer. */
    }
  };

  return (
    <section className="comments" id="comments">
      <header className="comments__header">
        <div>
          <p>Conversation</p>
          <h2>Comments</h2>
        </div>
        {comments.length ? (
          <span>
            {comments.length} {comments.length === 1 ? "thread" : "threads"}
          </span>
        ) : null}
      </header>
      <div className="comment-composer">
        <SafeImage src={user.profileImage} alt="" />
        <div>
          {replyingTo ? (
            <p className="comment-composer__replying">
              Replying to {replyName(replyingTo)}
              <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                <X size={13} />
              </button>
            </p>
          ) : null}
          <RichPostEditor
            compact
            expanded
            value={content}
            onChange={setContent}
            onSubmit={submit}
            placeholder={replyingTo ? "Write a thoughtful reply…" : "Add to the conversation…"}
          />
          {add.isError ? (
            <p className="feed-inline-error" role="alert">
              {getApiErrorMessage(add.error, "Your comment could not be posted.")}
            </p>
          ) : null}
          {content.length > 2000 ? (
            <p className="feed-inline-error" role="alert">
              Comments can contain up to 2,000 characters.
            </p>
          ) : null}
          <footer>
            <small>{content.length} / 2000</small>
            <button
              type="button"
              onClick={submit}
              disabled={!content.trim() || content.length > 2000 || add.isPending}
            >
              {add.isPending ? "Posting…" : replyingTo ? "Post reply" : "Post comment"}
              <Send size={14} />
            </button>
          </footer>
        </div>
      </div>
      <div className="comments__list">
        {query.isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div className="comment-skeleton" key={index}>
                <SkeletonAvatar size={34} />
                <SkeletonText lines={2} />
              </div>
            ))
          : null}
        {query.isError ? (
          <div className="comments__state">
            <MessageCircle size={18} />
            <strong>Comments could not load</strong>
            <p>The post is still available. Try loading its conversation again.</p>
            <Button variant="quiet" size="small" onClick={() => query.refetch()}>
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>
        ) : null}
        {!query.isLoading && !query.isError && !comments.length ? (
          <div className="comments__state">
            <MessageCircle size={18} />
            <strong>Start the conversation</strong>
            <p>Be the first to leave a useful comment.</p>
          </div>
        ) : null}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={post.id}
            type={type}
            user={user}
            onReply={(target) => {
              setReplyingTo(target);
              document
                .querySelector<HTMLElement>('.comment-composer [contenteditable="true"]')
                ?.focus();
            }}
          />
        ))}
      </div>
    </section>
  );
}
