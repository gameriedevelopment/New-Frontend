import { api, API_URL } from "../../lib/api";
import Cookies from "js-cookie";
import { io, type Socket } from "socket.io-client";
import type { ApiEnvelope, ChatMessage, ConversationsPage, MessageConversation, MessagesPage } from "./types";

export async function getConversations(page = 1, type: "user" | "team" = "user"): Promise<ConversationsPage> {
  const { data } = await api.get<ApiEnvelope<ConversationsPage>>("/messaging/conversations", { params: { page, limit: 20, type } });
  return data.data;
}

export async function getMessages(conversationId: string, before?: string | null): Promise<MessagesPage> {
  const { data } = await api.get<ApiEnvelope<MessagesPage>>(`/messaging/${conversationId}/messages`, { params: { before: before || undefined, limit: 50 } });
  return data.data;
}

export async function searchConversations(search: string): Promise<MessageConversation[]> {
  const { data } = await api.get<ApiEnvelope<MessageConversation[]>>("/messaging/search", { params: { search, limit: 20, offset: 0 } });
  return data.data;
}

export async function sendMessage(conversationId: string, content: string, isAnnouncement = false): Promise<ChatMessage> {
  const { data } = await api.post<ApiEnvelope<ChatMessage>>(`/messaging/${conversationId}/messages`, { content, isAnnouncement });
  return data.data;
}

export async function markConversationRead(conversationId: string): Promise<number> {
  const { data } = await api.post<ApiEnvelope<number>>(`/messaging/${conversationId}/read`, {});
  return data.data;
}

export async function getTotalUnread(): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>("/messaging/unread/count");
  return Number(data.data ?? 0);
}

export async function getConversationUnread(conversationId: string): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>(`/messaging/unread/count/${conversationId}`);
  return Number(data.data ?? 0);
}

let socket: Socket | null = null;
export function getMessagingSocket() {
  const realtimeUrl = API_URL.replace(/\/api\/v1\/?$/, "");
  const token = Cookies.get("auth_token");
  if (!socket) socket = io(`${realtimeUrl}/realtime`, { autoConnect: false, transports: ["websocket", "polling"], auth: { token }, withCredentials: true, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 500, reconnectionDelayMax: 5000 });
  socket.auth = { token };
  return socket;
}

export function connectMessagingSocket() {
  const active = getMessagingSocket();
  if (!active.connected) active.connect();
  return active;
}

export function disconnectMessagingSocket() { socket?.disconnect(); }
