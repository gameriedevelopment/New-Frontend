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
  id: string;
  name?: string;
  logo?: string | null;
  level?: string;
  members?: MessageTeamMember[];
}

export interface MessageTeamMember {
  userId?: string;
  user?: MessageUser;
  role?: string;
  title?: string;
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

export interface RecipientUser extends MessageUser {
  username: string;
}

export interface RecipientTeam extends MessageTeam {
  name: string;
}

export interface RecipientSearchPage<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users?: T[];
  teams?: T[];
}

export interface CreateConversationPayload {
  participantIds: string[];
  type: ConversationKind;
  name?: string;
  avatar?: string;
  teamId?: string;
}
