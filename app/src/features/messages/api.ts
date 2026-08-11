import { api, API_URL } from "../../lib/api";
import Cookies from "js-cookie";
import { io, type Socket } from "socket.io-client";
import type {
  ApiEnvelope,
  ChatMessage,
  ConversationsPage,
  CreateConversationPayload,
  MessageConversation,
  MessagesPage,
  RecipientSearchPage,
  RecipientTeam,
  RecipientUser,
} from "./types";

export async function getConversations(
  page = 1,
  type: "user" | "team" = "user",
): Promise<ConversationsPage> {
  const { data } = await api.get<ApiEnvelope<ConversationsPage>>("/messaging/conversations", {
    params: { page, limit: 20, type },
  });
  return data.data;
}

export async function getMessages(
  conversationId: string,
  before?: string | null,
): Promise<MessagesPage> {
  const { data } = await api.get<ApiEnvelope<MessagesPage>>(
    `/messaging/${conversationId}/messages`,
    { params: { before: before || undefined, limit: 50 } },
  );
  return data.data;
}

export async function searchConversations(search: string): Promise<MessageConversation[]> {
  const { data } = await api.get<ApiEnvelope<MessageConversation[]>>("/messaging/search", {
    params: { search, limit: 20, offset: 0 },
  });
  return data.data;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  isAnnouncement = false,
): Promise<ChatMessage> {
  const { data } = await api.post<ApiEnvelope<ChatMessage>>(
    `/messaging/${conversationId}/messages`,
    { content, isAnnouncement },
  );
  return data.data;
}

export async function editMessage(messageId: string, content: string): Promise<ChatMessage> {
  const { data } = await api.patch<ApiEnvelope<ChatMessage>>(`/messaging/messages/${messageId}`, {
    content,
  });
  return data.data;
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<ApiEnvelope<{ success: boolean }>>(
    `/messaging/messages/${messageId}`,
  );
  return data.data;
}

export async function createConversation(
  payload: CreateConversationPayload,
): Promise<MessageConversation> {
  const { data } = await api.post<ApiEnvelope<MessageConversation>>(
    "/messaging/conversations",
    payload,
  );
  return data.data;
}

export async function searchUsers(search: string): Promise<RecipientUser[]> {
  const { data } = await api.get<ApiEnvelope<RecipientSearchPage<RecipientUser>>>(
    "/users/search/all",
    { params: { search, page: 1, limit: 20 } },
  );
  return data.data.users ?? [];
}

export async function searchTeams(search: string): Promise<RecipientTeam[]> {
  const { data } = await api.get<ApiEnvelope<RecipientSearchPage<RecipientTeam>>>(
    "/teams/search/all",
    { params: { search, page: 1, limit: 20 } },
  );
  return data.data.teams ?? [];
}

export async function getUserTeams(userId: string): Promise<RecipientTeam[]> {
  const { data } = await api.get<ApiEnvelope<RecipientTeam[]>>(`/teams/user/${userId}`);
  return data.data;
}

export async function getTeamDetails(teamId: string): Promise<RecipientTeam> {
  const { data } = await api.get<ApiEnvelope<RecipientTeam>>(`/teams/${teamId}`);
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
  if (!socket)
    socket = io(`${realtimeUrl}/realtime`, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
  socket.auth = { token };
  return socket;
}

export function connectMessagingSocket() {
  const active = getMessagingSocket();
  if (!active.connected) active.connect();
  return active;
}

export function disconnectMessagingSocket() {
  socket?.disconnect();
}
