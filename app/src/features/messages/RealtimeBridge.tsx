import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectMessagingSocket, disconnectMessagingSocket } from "./api";
import { useAuthStore } from "../auth/authStore";

export function RealtimeBridge() {
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    if (!user?.id) { disconnectMessagingSocket(); return; }
    const socket = connectMessagingSocket();
    const refresh = (payload?: { conversationId?: string }) => {
      client.invalidateQueries({ queryKey: ["conversations"] });
      client.invalidateQueries({ queryKey: ["total-unread-counts"] });
      if (payload?.conversationId) {
        client.invalidateQueries({ queryKey: ["messages", payload.conversationId] });
        client.invalidateQueries({ queryKey: ["unread-counts", payload.conversationId] });
      }
    };
    ["message.created", "message.sent", "message.edited", "message.deleted", "conversation.read"].forEach((event) => socket.on(event, refresh));
    return () => { ["message.created", "message.sent", "message.edited", "message.deleted", "conversation.read"].forEach((event) => socket.off(event, refresh)); };
  }, [client, user?.id]);
  return null;
}
