import { create } from "zustand";
import type { AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  status: "active" | "pending" | null;
  verificationOngoing: boolean;
  setUser: (user: AuthUser | null, remember?: boolean) => void;
  setVerificationOngoing: (value: boolean) => void;
  clearUser: () => void;
}

const storageKey = "Gamerie_user";

function readUser(): AuthUser | null {
  try {
    const value = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    return null;
  }
}

const initialUser = readUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  status: initialUser ? (initialUser.emailVerified ? "active" : "pending") : null,
  verificationOngoing: false,
  setUser: (user, remember = false) => {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (user) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(storageKey, JSON.stringify(user));
    }
    set({ user, status: user ? (user.emailVerified ? "active" : "pending") : null });
  },
  setVerificationOngoing: (verificationOngoing) => set({ verificationOngoing }),
  clearUser: () => {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    set({ user: null, status: null, verificationOngoing: false });
  },
}));
