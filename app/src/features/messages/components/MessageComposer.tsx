import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../../../lib/errors";

export function MessageComposer({ disabled, onSend, pending }: { disabled?: boolean; onSend: (content: string) => Promise<void>; pending: boolean }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submit = async () => {
    const clean = content.trim();
    if (!clean || pending || disabled) return;
    setError(null);
    try { await onSend(clean); setContent(""); requestAnimationFrame(() => inputRef.current?.focus()); }
    catch (reason) { setError(getApiErrorMessage(reason, "Your message could not be sent.")); }
  };
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  }, [content]);
  return <div className="message-composer"><div><textarea ref={inputRef} value={content} disabled={disabled} rows={1} maxLength={4000} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Write a message" aria-label="Message" /><button type="button" disabled={!content.trim() || pending || disabled} onClick={() => void submit()} aria-label="Send message"><Send size={17} /></button></div><footer><span><kbd>Enter</kbd> sends · <kbd>Shift</kbd> + <kbd>Enter</kbd> adds a line</span><small>{content.length} / 4000</small></footer>{error ? <p role="alert">{error}</p> : null}</div>;
}
