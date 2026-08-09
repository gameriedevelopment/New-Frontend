import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { Button, SafeImage, Skeleton, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useAuthStore } from "../../auth/authStore";
import { useConversationRealtime, useDeleteMessage, useEditMessage, useMarkConversationRead, useMessageTeam, useRealtimeStatus, useSendMessage } from "../hooks";
import { createQuotedReply } from "../messageQuote";
import type { ChatMessage, MessageConversation } from "../types";
import { conversationIdentity } from "./ConversationRow";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { MessageDialog } from "./MessageDialog";

function MessageHistorySkeleton() {
  return <div className="message-history-skeleton" aria-label="Loading messages" role="status">{Array.from({ length: 5 }, (_, index) => <div key={index} data-own={index % 3 === 1 || undefined}>{index % 3 !== 1 ? <SkeletonAvatar size={28} /> : null}<span><Skeleton width={index % 2 ? 210 : 270} height={58} /><SkeletonText lines={1} /></span></div>)}</div>;
}

function sameGroup(message: ChatMessage, previous?: ChatMessage) {
  if (!previous || previous.senderId !== message.senderId || previous.isAnnouncement !== message.isAnnouncement) return false;
  const currentTime = new Date(message.timestamp ?? message.createdAt ?? 0).getTime();
  const previousTime = new Date(previous.timestamp ?? previous.createdAt ?? 0).getTime();
  return Math.abs(currentTime - previousTime) < 5 * 60_000;
}

export function MessageThread({ conversation, error, fetchingOlder, hasOlder, loading, messages, onBack, onLoadOlder, onRetry, unread }: { conversation: MessageConversation; error: boolean; fetchingOlder: boolean; hasOlder: boolean; loading: boolean; messages: ChatMessage[]; onBack: () => void; onLoadOlder: () => Promise<unknown>; onRetry: () => void; unread: number }) {
  const user = useAuthStore((state) => state.user);
  const type = conversation.type === "user" ? "user" : "team";
  const identity = useMemo(() => conversationIdentity(conversation, user?.id), [conversation, user?.id]);
  const send = useSendMessage(conversation.id, user);
  const edit = useEditMessage(conversation.id);
  const remove = useDeleteMessage(conversation.id);
  const read = useMarkConversationRead(type);
  const teamQuery = useMessageTeam(conversation.type === "user" ? undefined : conversation.team?.id);
  const status = useRealtimeStatus();
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialConversation = useRef<string | null>(null);
  useConversationRealtime(conversation.id);

  useEffect(() => { setReplyTo(null); setEditing(null); setDeleteTarget(null); }, [conversation.id]);

  useEffect(() => {
    if (unread > 0 && !read.isPending) read.mutate(conversation.id);
  }, [conversation.id, read.isPending, read.mutate, unread]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || loading) return;
    if (initialConversation.current !== conversation.id) {
      initialConversation.current = conversation.id;
      node.scrollTop = node.scrollHeight;
    }
  }, [conversation.id, loading, messages.length]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || fetchingOlder) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 150;
    if (nearBottom) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [fetchingOlder, messages.length]);

  const loadOlder = async () => {
    const node = scrollRef.current;
    if (!node || !hasOlder || fetchingOlder) return;
    const oldHeight = node.scrollHeight;
    const oldTop = node.scrollTop;
    await onLoadOlder();
    requestAnimationFrame(() => { node.scrollTop = oldTop + node.scrollHeight - oldHeight; });
  };

  const team = teamQuery.data ?? conversation.team;
  const currentMembership = team?.members?.find((member) => member.user?.id === user?.id || member.userId === user?.id);
  const normalizedRole = `${currentMembership?.role ?? ""} ${currentMembership?.title ?? ""}`.toLowerCase();
  const canAnnounce = conversation.type === "team" && ["owner", "leader", "vice leader", "deputy leader", "manager"].some((role) => normalizedRole.includes(role));
  const submit = async (content: string, isAnnouncement: boolean) => {
    if (editing) { await edit.mutateAsync({ messageId: editing.id, content }); return; }
    const persistedContent = replyTo ? createQuotedReply(replyTo, content) : content;
    await send.mutateAsync({ content: persistedContent, isAnnouncement: canAnnounce && isAnnouncement });
  };
  const startReply = (message: ChatMessage) => { setEditing(null); setReplyTo(message); };
  const startEdit = (message: ChatMessage) => { setReplyTo(null); setEditing(message); };
  const clearContext = () => { setReplyTo(null); setEditing(null); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      if (editing?.id === deleteTarget.id) clearContext();
      setDeleteTarget(null);
    } catch {
      // Mutation state renders the contextual error inside the confirmation dialog.
    }
  };

  return <section className="message-thread" aria-label={`Conversation with ${identity.name}`}>
    <header>
      <button className="message-thread__back" type="button" onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
      <span className="message-thread__avatar">{identity.image ? <SafeImage src={identity.image} alt="" fallback={conversation.type === "user" ? "/avatar-fallback.svg" : "/media-fallback.svg"} /> : identity.name.slice(0, 2).toUpperCase()}</span>
      <div><h2>{identity.name}</h2><p>{conversation.type === "user" ? identity.teammate?.gamerTitle || (identity.online ? "Online" : "Direct conversation") : conversation.type === "team-inbox" ? "Team inbox" : `${conversation.team?.members?.length ?? conversation.participants.length} members`}</p></div>
      <span className="message-thread__status" data-status={status}><i />{status === "online" ? "Connected" : status === "connecting" ? "Reconnecting" : "Offline"}</span>
    </header>
    <div className="message-history" ref={scrollRef}>
      {hasOlder && !loading ? <button className="message-history__older" type="button" onClick={() => void loadOlder()} disabled={fetchingOlder}>{fetchingOlder ? "Loading earlier messages…" : "Load earlier messages"}</button> : null}
      {loading ? <MessageHistorySkeleton /> : null}
      {error ? <div className="message-history__state"><MessageCircle size={20} /><strong>Messages could not load</strong><p>The conversation is still here. Try loading it again.</p><Button size="small" variant="quiet" onClick={onRetry}><RefreshCw size={14} />Retry</Button></div> : null}
      {!loading && !error && !messages.length ? <div className="message-history__state"><MessageCircle size={20} /><strong>Start the conversation</strong><p>Send a clear first message—no ceremony needed.</p></div> : null}
      {!loading && !error ? messages.map((message, index) => <MessageBubble key={message.id} message={message} own={message.senderId === user?.id} grouped={sameGroup(message, messages[index - 1])} onReply={startReply} onEdit={startEdit} onDelete={setDeleteTarget} />) : null}
    </div>
    <MessageComposer pending={send.isPending || edit.isPending} replyTo={replyTo} editing={editing} canAnnounce={canAnnounce} onCancelContext={clearContext} onSubmit={submit} />
    {deleteTarget ? <MessageDialog destructive title="Delete message?" onClose={() => !remove.isPending && setDeleteTarget(null)}><p>This message will be removed from the conversation for everyone. This cannot be undone.</p>{remove.isError ? <p className="message-inline-error" role="alert">{getApiErrorMessage(remove.error, "The message could not be deleted.")}</p> : null}<footer><button type="button" onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>Keep message</button><button className="is-danger" type="button" onClick={() => void confirmDelete()} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete message"}</button></footer></MessageDialog> : null}
  </section>;
}
