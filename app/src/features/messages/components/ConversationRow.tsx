import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useConversationUnread, useDeleteConversation } from "../hooks";
import { messageExcerpt } from "../messageQuote";
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
    name: teamConversation
      ? conversation.name || conversation.team?.name || "Team conversation"
      : teammate?.displayName || teammate?.username || "Deleted player",
    image: teamConversation
      ? conversation.avatar || conversation.team?.logo
      : teammate?.profilePictureUrl || teammate?.profileImage,
    online: !teamConversation && Boolean(teammate?.isOnline),
    teammate,
  };
}

export function ConversationRow({
  conversation,
  onSelect,
  selected,
  onDeleted,
}: {
  conversation: MessageConversation;
  onSelect: () => void;
  selected: boolean;
  onDeleted?: (id: string) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const unreadQuery = useConversationUnread(conversation.id);
  const unread = Number(unreadQuery.data ?? conversation.unreadCount ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const remove = useDeleteConversation();
  const identity = useMemo(
    () => conversationIdentity(conversation, user?.id),
    [conversation, user?.id],
  );
  const rawLastMessage =
    typeof conversation.lastMessage === "string"
      ? conversation.lastMessage
      : conversation.lastMessage?.content;
  const lastMessage = rawLastMessage
    ? messageExcerpt(rawLastMessage) || "Message"
    : "No messages yet";

  useEffect(() => {
    if (!menuOpen) return;
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [menuOpen]);

  const confirmDelete = () => {
    remove.mutate(conversation.id, {
      onSuccess: () => {
        setConfirming(false);
        setMenuOpen(false);
        onDeleted?.(conversation.id);
      },
    });
  };

  return (
    <div className="conversation-row-wrap" data-selected={selected || undefined}>
      <button
        className="conversation-row"
        data-selected={selected || undefined}
        data-unread={unread > 0 || undefined}
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
      >
        <span className="conversation-row__avatar">
          {identity.image ? (
            <SafeImage
              src={identity.image}
              alt=""
              fallback={
                conversation.type === "user" ? "/user-profile-fallback.jpg" : "/media-fallback.svg"
              }
            />
          ) : (
            <span>{identity.name.slice(0, 2).toUpperCase()}</span>
          )}
          {identity.online ? <i aria-label="Online" /> : null}
        </span>
        <span className="conversation-row__body">
          <span>
            <strong>{identity.name}</strong>
            <time dateTime={conversation.lastMessageTime}>
              {relativeTime(conversation.lastMessageTime)}
            </time>
          </span>
          <span>
            <small>{lastMessage}</small>
            {unread ? (
              <b aria-label={`${unread} unread messages`}>{unread > 99 ? "99+" : unread}</b>
            ) : null}
          </span>
        </span>
      </button>
      <div className="conversation-row__menu" ref={menuRef}>
        <button
          type="button"
          className="conversation-row__menu-trigger"
          aria-label="Conversation options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((open) => !open);
            setConfirming(false);
          }}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen ? (
          <div className="conversation-row__menu-panel" role="menu">
            {confirming ? (
              <div className="conversation-row__confirm">
                <p>Remove this conversation from your list?</p>
                <div>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={remove.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={confirmDelete}
                    disabled={remove.isPending}
                  >
                    {remove.isPending ? "Removing…" : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="conversation-row__menu-item is-danger"
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={14} />
                Delete conversation
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
