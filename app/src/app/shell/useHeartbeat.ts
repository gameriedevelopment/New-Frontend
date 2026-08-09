import { useEffect } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../features/auth/authStore";

export function useHeartbeat() {
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const sendHeartbeat = async () => {
      try {
        await api.post("/auth/heartbeat");
        if (!active) return;
        const current = useAuthStore.getState().user;
        if (current && !current.isOnline) {
          const remembered = Boolean(localStorage.getItem("Gamerie_user"));
          useAuthStore.getState().setUser({ ...current, isOnline: true }, remembered);
        }
      } catch {
        // Presence is best-effort and must not interrupt the product shell.
      }
    };

    void sendHeartbeat();
    const interval = window.setInterval(() => void sendHeartbeat(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId]);
}
