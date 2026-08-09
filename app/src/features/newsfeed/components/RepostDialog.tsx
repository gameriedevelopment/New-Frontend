import { Repeat2 } from "lucide-react";
import { useState } from "react";
import { getApiErrorMessage } from "../../../lib/errors";
import { useToggleRepost } from "../hooks";
import type { FeedPost } from "../types";
import { CommentDialog } from "./CommentDialog";
import { RepostEmbed } from "./RepostEmbed";

export function RepostDialog({ onClose, post }: { onClose: () => void; post: FeedPost }) {
  const [comment, setComment] = useState("");
  const repost = useToggleRepost(post);
  const submit = async () => {
    try { await repost.mutateAsync(comment.trim()); onClose(); } catch { /* Error remains in the dialog. */ }
  };
  return <CommentDialog title="Repost to your feed" onClose={onClose}>
    <div className="repost-dialog__intro"><Repeat2 size={16} /><p>Add your perspective, or repost it without a comment.</p></div>
    <textarea value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment (optional)" autoFocus />
    <p className="comment-dialog__count">{comment.length} / 2000</p>
    <RepostEmbed post={post} />
    {repost.isError ? <p className="feed-inline-error" role="alert">{getApiErrorMessage(repost.error, "The post could not be reposted.")}</p> : null}
    <footer><button type="button" onClick={onClose}>Cancel</button><button type="button" className="is-primary" disabled={repost.isPending} onClick={submit}>{repost.isPending ? "Reposting…" : "Repost"}</button></footer>
  </CommentDialog>;
}
