import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearAdminCredential, fetchAdminSession, hasAdminCredential, signInAdmin } from "./api";
import type { AdminUser } from "./types";

interface AuthContextValue {
  user: AdminUser | null;
  status: "checking" | "anonymous" | "authenticated";
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("checking");

  useEffect(() => {
    let active = true;
    if (!hasAdminCredential()) {
      setStatus("anonymous");
      return;
    }

    void fetchAdminSession()
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearAdminCredential();
        setStatus("anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await signInAdmin(email, password);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(() => {
    clearAdminCredential();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ user, status, signIn, signOut }), [signIn, signOut, status, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AuthProvider.");
  return context;
}
