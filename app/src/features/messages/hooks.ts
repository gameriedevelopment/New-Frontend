import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { AuthUser } from "../auth/types";
import {
  connectMessagingSocket,
  createConversation,
  deleteMessage,
  editMessage,
  getConversationUnread,
  getConversations,
  getMessages,
  getTeamDetails,
  getTotalUnread,
  getUserTeams,
  markConversationRead,
  searchConversations,
  searchTeams,
  searchUsers,
  sendMessage,
} from "./api";
import type {
  ChatMessage,
  ConversationsPage,
  CreateConversationPayload,
  MessageConversation,
  MessagesPage,
  RecipientTeam,
  RecipientUser,
} from "./types";

export function useConversations(type: "user" | "team") {
  return useInfiniteQuery({
    queryKey: ["conversations", type],
    queryFn: ({ pageParam }) => getConversations(pageParam, type),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMessages(conversationId?: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor || undefined,
    enabled: Boolean(conversationId),
    refetchOnWindowFocus: false,
  });
}

export function useConversationSearch(search: string) {
  return useQuery({
    queryKey: ["conversation-search", search],
    queryFn: () => searchConversations(search),
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useTotalUnread() {
  return useQuery({
    queryKey: ["total-unread-counts"],
    queryFn: getTotalUnread,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useConversationUnread(conversationId?: string) {
  return useQuery({
    queryKey: ["unread-counts", conversationId],
    queryFn: () => getConversationUnread(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 10_000,
  });
}

function addOptimisticMessage(data: InfiniteData<MessagesPage> | undefined, message: ChatMessage) {
  if (!data)
    return {
      pages: [{ data: [message], nextCursor: null }],
      pageParams: [null],
    } as InfiniteData<MessagesPage>;
  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === 0 ? { ...page, data: [message, ...page.data] } : page,
    ),
  };
}

function replaceMessage(
  data: InfiniteData<MessagesPage> | undefined,
  temporaryId: string,
  message: ChatMessage,
) {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((current) => (current.id === temporaryId ? message : current)),
    })),
  };
}

function removeMessage(data: InfiniteData<MessagesPage> | undefined, messageId: string) {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((message) => message.id !== messageId),
    })),
  };
}

export function useSendMessage(conversationId: string, user?: AuthUser | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      content,
      isAnnouncement = false,
    }: {
      content: string;
      isAnnouncement?: boolean;
    }) => sendMessage(conversationId, content, isAnnouncement),
    onMutate: async ({ content, isAnnouncement }) => {
      const key = ["messages", conversationId];
      await client.cancelQueries({ queryKey: key });
      const snapshot = client.getQueryData<InfiniteData<MessagesPage>>(key);
      const temporaryId = `pending-${crypto.randomUUID()}`;
      client.setQueryData(
        key,
        addOptimisticMessage(snapshot, {
          id: temporaryId,
          conversationId,
          content,
          isAnnouncement,
          senderId: user?.id ?? "",
          senderName: user?.username,
          senderAvatar: user?.profileImage,
          timestamp: new Date().toISOString(),
        }),
      );
      return { snapshot, temporaryId };
    },
    onSuccess: (message, _variables, context) =>
      client.setQueryData(
        ["messages", conversationId],
        (data: InfiniteData<MessagesPage> | undefined) =>
          replaceMessage(data, context!.temporaryId, message),
      ),
    onError: (_error, _variables, context) =>
      client.setQueryData(["messages", conversationId], context?.snapshot),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ["messages", conversationId] });
      client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const client = useQueryClient();
  const key = ["messages", conversationId];
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editMessage(messageId, content),
    onMutate: async ({ messageId, content }) => {
      await client.cancelQueries({ queryKey: key });
      const snapshot = client.getQueryData<InfiniteData<MessagesPage>>(key);
      client.setQueryData(key, (data: InfiniteData<MessagesPage> | undefined) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                data: page.data.map((message) =>
                  message.id === messageId ? { ...message, content } : message,
                ),
              })),
            }
          : data,
      );
      return { snapshot };
    },
    onSuccess: (message) =>
      client.setQueryData(key, (data: InfiniteData<MessagesPage> | undefined) =>
        replaceMessage(data, message.id, message),
      ),
    onError: (_error, _variables, context) => client.setQueryData(key, context?.snapshot),
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const client = useQueryClient();
  const key = ["messages", conversationId];
  return useMutation({
    mutationFn: deleteMessage,
    onMutate: async (messageId) => {
      await client.cancelQueries({ queryKey: key });
      const snapshot = client.getQueryData<InfiniteData<MessagesPage>>(key);
      client.setQueryData(key, (data: InfiniteData<MessagesPage> | undefined) =>
        removeMessage(data, messageId),
      );
      return { snapshot };
    },
    onError: (_error, _messageId, context) => client.setQueryData(key, context?.snapshot),
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationPayload) => createConversation(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useRecipientSearch(type: "user" | "team", search: string) {
  return useQuery<Array<RecipientUser | RecipientTeam>>({
    queryKey: ["message-recipients", type, search],
    queryFn: async () => (type === "user" ? await searchUsers(search) : await searchTeams(search)),
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useUserTeams(userId?: string) {
  return useQuery({
    queryKey: ["user-teams", userId],
    queryFn: () => getUserTeams(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useMessageTeam(teamId?: string) {
  return useQuery({
    queryKey: ["message-team", teamId],
    queryFn: () => getTeamDetails(teamId!),
    enabled: Boolean(teamId),
    staleTime: 5 * 60_000,
  });
}

export function useMarkConversationRead(type: "user" | "team") {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markConversationRead,
    onMutate: async (conversationId) => {
      const roots: QueryKey[] = [
        ["conversations", type],
        ["total-unread-counts"],
        ["unread-counts", conversationId],
      ];
      await Promise.all(roots.map((queryKey) => client.cancelQueries({ queryKey })));
      const snapshots = roots.flatMap((queryKey) => client.getQueriesData({ queryKey }));
      const unread = Number(client.getQueryData(["unread-counts", conversationId]) ?? 0);
      client.setQueriesData(
        { queryKey: ["conversations", type] },
        (data: InfiniteData<ConversationsPage> | undefined) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conversation) =>
                    conversation.id === conversationId
                      ? { ...conversation, unreadCount: 0 }
                      : conversation,
                  ),
                })),
              }
            : data,
      );
      client.setQueryData(["unread-counts", conversationId], 0);
      client.setQueryData(["total-unread-counts"], (current: number | undefined) =>
        typeof current === "number" ? Math.max(0, current - unread) : current,
      );
      return { snapshots };
    },
    onError: (_error, _id, context) =>
      context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data)),
    onSettled: (_data, _error, conversationId) => {
      client.invalidateQueries({ queryKey: ["conversations", type] });
      client.invalidateQueries({ queryKey: ["total-unread-counts"] });
      client.invalidateQueries({ queryKey: ["unread-counts", conversationId] });
    },
  });
}

export function useConversationRealtime(conversationId?: string) {
  useEffect(() => {
    if (!conversationId) return;
    const socket = connectMessagingSocket();
    socket.emit("conversation.join", { conversationId });
    return () => {
      socket.emit("conversation.leave", { conversationId });
    };
  }, [conversationId]);
}

export function useRealtimeStatus() {
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  useEffect(() => {
    const socket = connectMessagingSocket();
    const online = () => setStatus("online");
    const offline = () => setStatus("offline");
    const connecting = () => setStatus("connecting");
    setStatus(socket.connected ? "online" : "connecting");
    socket.on("connect", online);
    socket.on("disconnect", offline);
    socket.io.on("reconnect_attempt", connecting);
    socket.on("connect_error", offline);
    return () => {
      socket.off("connect", online);
      socket.off("disconnect", offline);
      socket.io.off("reconnect_attempt", connecting);
      socket.off("connect_error", offline);
    };
  }, []);
  return status;
}

export function flattenConversations(
  data?: InfiniteData<ConversationsPage>,
): MessageConversation[] {
  return data?.pages.flatMap((page) => page.data) ?? [];
}
