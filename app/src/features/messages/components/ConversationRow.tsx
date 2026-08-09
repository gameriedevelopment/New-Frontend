import { useMemo } from "react";
import { SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useConversationUnread } from "../hooks";
import type { MessageConversation } from "../types";

function relativeTime(value?: string) {
  if (!value) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

export function conversationIdentity(conversation: MessageConversation, userId?: string) {
  const teammate = conversation.participants?.find((participant) => participant.id !== userId);
  const teamConversation = conversation.type !== "user";
  return {
    name: teamConversation ? conversation.name || conversation.team?.name || "Team conversation" : teammate?.displayName || teammate?.username || "Deleted player",
    image: teamConversation ? conversation.avatar || conversation.team?.logo : teammate?.profilePictureUrl || teammate?.profileImage,
    online: !teamConversation && Boolean(teammate?.isOnline),
    teammate,
  };
}

export function ConversationRow({ conversation, onSelect, selected }: { conversation: MessageConversation; onSelect: () => void; selected: boolean }) {
  const user = useAuthStore((state) => state.user);
  const unreadQuery = useConversationUnread(conversation.id);
  const unread = Number(unreadQuery.data ?? conversation.unreadCount ?? 0);
  const identity = useMemo(() => conversationIdentity(conversation, user?.id), [conversation, user?.id]);
  const lastMessage = typeof conversation.lastMessage === "string" ? conversation.lastMessage : conversation.lastMessage?.content ?? "No messages yet";

  return <button className="conversation-row" data-selected={selected || undefined} data-unread={unread > 0 || undefined} type="button" onClick={onSelect} aria-current={selected ? "true" : undefined}>
    <span className="conversation-row__avatar">{identity.image ? <SafeImage src={identity.image} alt="" fallback={conversation.type === "user" ? "/avatar-fallback.svg" : "/media-fallback.svg"} /> : <span>{identity.name.slice(0, 2).toUpperCase()}</span>}{identity.online ? <i aria-label="Online" /> : null}</span>
    <span className="conversation-row__body"><span><strong>{identity.name}</strong><time dateTime={conversation.lastMessageTime}>{relativeTime(conversation.lastMessageTime)}</time></span><span><small>{lastMessage}</small>{unread ? <b aria-label={`${unread} unread messages`}>{unread > 99 ? "99+" : unread}</b> : null}</span></span>
  </button>;
}
