import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectMessagingSocket, disconnectMessagingSocket } from "./api";
import { useAuthStore } from "../auth/authStore";

export function RealtimeBridge() {
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (!user?.id) {
      disconnectMessagingSocket();
      return;
    }
    const socket = connectMessagingSocket();
    const refresh = (payload?: { conversationId?: string }) => {
      client.invalidateQueries({ queryKey: ["conversations"] });
      client.invalidateQueries({ queryKey: ["total-unread-counts"] });
      if (payload?.conversationId) {
        client.invalidateQueries({ queryKey: ["messages", payload.conversationId] });
        client.invalidateQueries({ queryKey: ["unread-counts", payload.conversationId] });
      }
    };
    const refreshNotifications = (payload?: { message?: string }) => {
      client.invalidateQueries({ queryKey: ["notifications", user.id] });
      client.invalidateQueries({ queryKey: ["teams", "invites", "mine"] });
      client.invalidateQueries({ queryKey: ["hubs", "invites", "mine"] });
      client.invalidateQueries({ queryKey: ["team-operations"] });
      client.invalidateQueries({ queryKey: ["hub-operations"] });
      if (payload?.message) setAnnouncement(payload.message);
    };
    [
      "message.created",
      "message.sent",
      "message.edited",
      "message.deleted",
      "conversation.read",
    ].forEach((event) => socket.on(event, refresh));
    socket.on("notification.created", refreshNotifications);
    return () => {
      [
        "message.created",
        "message.sent",
        "message.edited",
        "message.deleted",
        "conversation.read",
      ].forEach((event) => socket.off(event, refresh));
      socket.off("notification.created", refreshNotifications);
    };
  }, [client, user?.id]);
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
