export type ConversationKind = "user" | "team" | "team-inbox";

export interface MessageUser {
  id: string;
  username?: string;
  displayName?: string;
  profileImage?: string | null;
  profilePictureUrl?: string | null;
  gamerTitle?: string;
  isOnline?: boolean;
}

export interface MessageTeam {
  id?: string;
  name?: string;
  logo?: string | null;
  members?: Array<{ userId?: string; user?: MessageUser; role?: string; title?: string }>;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  timestamp?: string;
  createdAt?: string;
  isSeen?: boolean;
  isAnnouncement?: boolean;
  conversationId?: string;
}

export interface MessageConversation {
  id: string;
  type: ConversationKind;
  name?: string;
  avatar?: string | null;
  participants: MessageUser[];
  team?: MessageTeam | null;
  lastMessage?: string | ChatMessage | null;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface ConversationsPage {
  data: MessageConversation[];
  page: number;
  totalPages: number;
  total?: number;
}

export interface MessagesPage {
  data: ChatMessage[];
  nextCursor?: string | null;
}

export interface ApiEnvelope<T> { data: T; message?: string; statusCode?: number }
