import { Check, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SafeImage } from "../../../components/ui";
import { RichText } from "../../newsfeed/components/RichText";
import type { ChatMessage } from "../types";

function messageTime(value?: string) { return value ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Sending"; }

export function MessageBubble({ grouped, message, onDelete, onEdit, onReply, own }: { grouped: boolean; message: ChatMessage; onDelete: (message: ChatMessage) => void; onEdit: (message: ChatMessage) => void; onReply: (message: ChatMessage) => void; own: boolean }) {
  const pending = message.id.startsWith("pending-");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [menuOpen]);
  return <article className="message-bubble" data-own={own || undefined} data-grouped={grouped || undefined} data-pending={pending || undefined}>
    {!own && !grouped ? <SafeImage className="message-bubble__avatar" src={message.senderAvatar} alt="" /> : null}
    <div className="message-bubble__body">
      {!own && !grouped ? <strong>{message.senderName || "Deleted player"}</strong> : null}
      {message.isAnnouncement ? <span className="message-bubble__announcement">Announcement</span> : null}
      {!pending ? <div className="message-bubble__actions"><button type="button" onClick={() => onReply(message)} aria-label={`Reply to ${own ? "your message" : message.senderName || "message"}`} title="Reply"><Reply size={14} /></button>{own ? <div ref={menuRef}><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Message actions" aria-expanded={menuOpen}><MoreHorizontal size={15} /></button>{menuOpen ? <div className="message-bubble__menu"><button type="button" onClick={() => { setMenuOpen(false); onEdit(message); }}><Pencil size={13} />Edit</button><button type="button" className="is-danger" onClick={() => { setMenuOpen(false); onDelete(message); }}><Trash2 size={13} />Delete</button></div> : null}</div> : null}</div> : null}
      <div className="message-bubble__content"><RichText content={message.content} /></div>
      <footer><time dateTime={message.timestamp ?? message.createdAt}>{messageTime(message.timestamp ?? message.createdAt)}</time>{own && !pending ? <span><Check size={12} />{message.isSeen ? "Seen" : "Sent"}</span> : null}</footer>
    </div>
  </article>;
}
