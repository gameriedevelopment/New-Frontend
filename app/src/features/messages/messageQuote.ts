import type { ChatMessage } from "./types";

export function messageExcerpt(content: string, limit = 140) {
  const plain = content
    .replace(/^>.*$/gm, "")
    .replace(/[*_`~#\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > limit ? `${plain.slice(0, limit - 1).trimEnd()}…` : plain;
}

export function createQuotedReply(message: ChatMessage, response: string) {
  const name = (message.senderName || "Player").replace(/[\r\n:*_`]/g, "").trim() || "Player";
  const excerpt = messageExcerpt(message.content).replace(/\n/g, " ");
  return `> **${name}:** ${excerpt}\n\n${response.trim()}`;
}
