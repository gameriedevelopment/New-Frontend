import { Check } from "lucide-react";
import { SafeImage } from "../../../components/ui";
import { RichText } from "../../newsfeed/components/RichText";
import type { ChatMessage } from "../types";

function messageTime(value?: string) { return value ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Sending"; }

export function MessageBubble({ grouped, message, own }: { grouped: boolean; message: ChatMessage; own: boolean }) {
  const pending = message.id.startsWith("pending-");
  return <article className="message-bubble" data-own={own || undefined} data-grouped={grouped || undefined} data-pending={pending || undefined}>
    {!own && !grouped ? <SafeImage className="message-bubble__avatar" src={message.senderAvatar} alt="" /> : null}
    <div>
      {!own && !grouped ? <strong>{message.senderName || "Deleted player"}</strong> : null}
      {message.isAnnouncement ? <span className="message-bubble__announcement">Announcement</span> : null}
      <div className="message-bubble__content"><RichText content={message.content} /></div>
      <footer><time dateTime={message.timestamp ?? message.createdAt}>{messageTime(message.timestamp ?? message.createdAt)}</time>{own && !pending ? <span><Check size={12} />{message.isSeen ? "Seen" : "Sent"}</span> : null}</footer>
    </div>
  </article>;
}
