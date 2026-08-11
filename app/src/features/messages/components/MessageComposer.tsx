import { Check, Megaphone, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../../../lib/errors";
import { messageExcerpt } from "../messageQuote";
import type { ChatMessage } from "../types";

export function MessageComposer({
  canAnnounce = false,
  editing,
  onCancelContext,
  onSubmit,
  pending,
  replyTo,
}: {
  canAnnounce?: boolean;
  editing?: ChatMessage | null;
  onCancelContext: () => void;
  onSubmit: (content: string, isAnnouncement: boolean) => Promise<void>;
  pending: boolean;
  replyTo?: ChatMessage | null;
}) {
  const [content, setContent] = useState("");
  const [announcement, setAnnouncement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submit = async () => {
    const clean = content.trim();
    if (!clean || pending) return;
    setError(null);
    try {
      await onSubmit(clean, !editing && announcement);
      setContent("");
      setAnnouncement(false);
      onCancelContext();
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Your message could not be sent."));
    }
  };
  useEffect(() => {
    if (!editing) return;
    setContent(editing.content);
    setAnnouncement(Boolean(editing.isAnnouncement));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(editing.content.length, editing.content.length);
    });
  }, [editing]);
  useEffect(() => {
    if (!replyTo || editing) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [editing, replyTo]);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  }, [content]);
  const context = editing ?? replyTo;
  return (
    <div className="message-composer" data-announcement={announcement || undefined}>
      {context ? (
        <div className="message-composer__context">
          <span>
            {editing ? "Editing your message" : `Replying to ${replyTo?.senderName || "player"}`}
            <small>{messageExcerpt(context.content, 110)}</small>
          </span>
          <button
            type="button"
            onClick={() => {
              setContent("");
              setAnnouncement(false);
              onCancelContext();
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            aria-label={editing ? "Cancel editing" : "Cancel reply"}
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
      <div className="message-composer__field">
        <textarea
          ref={inputRef}
          value={content}
          rows={1}
          maxLength={4000}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={
            editing ? "Update your message" : replyTo ? "Write your reply" : "Write a message"
          }
          aria-label={editing ? "Edit message" : "Message"}
        />
        {canAnnounce && !editing ? (
          <button
            className="message-composer__announce"
            type="button"
            onClick={() => setAnnouncement((current) => !current)}
            aria-pressed={announcement}
            title="Send as a team announcement"
          >
            <Megaphone size={16} />
          </button>
        ) : null}
        <button
          className="message-composer__submit"
          type="button"
          disabled={!content.trim() || pending}
          onClick={() => void submit()}
          aria-label={
            editing ? "Save message" : announcement ? "Send announcement" : "Send message"
          }
        >
          {editing ? <Check size={18} /> : <Send size={17} />}
        </button>
      </div>
      <footer>
        <span>
          {announcement ? (
            "Team announcement"
          ) : editing ? (
            "Saving changes to this message"
          ) : (
            <>
              <kbd>Enter</kbd> sends · <kbd>Shift</kbd> + <kbd>Enter</kbd> adds a line
            </>
          )}
        </span>
        <small>{content.length} / 4000</small>
      </footer>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
