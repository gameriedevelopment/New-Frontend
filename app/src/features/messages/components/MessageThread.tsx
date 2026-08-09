import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Button, SafeImage, Skeleton, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useConversationRealtime, useMarkConversationRead, useRealtimeStatus, useSendMessage } from "../hooks";
import type { ChatMessage, MessageConversation } from "../types";
import { conversationIdentity } from "./ConversationRow";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

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
  const read = useMarkConversationRead(type);
  const status = useRealtimeStatus();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialConversation = useRef<string | null>(null);
  useConversationRealtime(conversation.id);

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
      {!loading && !error ? messages.map((message, index) => <MessageBubble key={message.id} message={message} own={message.senderId === user?.id} grouped={sameGroup(message, messages[index - 1])} />) : null}
    </div>
    <MessageComposer pending={send.isPending} onSend={async (content) => { await send.mutateAsync({ content }); }} />
  </section>;
}
