import Cookies from "js-cookie";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchSmsVerificationEnabled, syncUserWithBackend } from "../api";
import { useAuthStore } from "../authStore";

type GateState = "checking" | "ready" | "login" | "email" | "phone";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const location = useLocation();
  const storedUser = useAuthStore((state) => state.user);
  const [gate, setGate] = useState<GateState>("checking");

  useEffect(() => {
    let active = true;

    const resolveAccess = async () => {
      let user = useAuthStore.getState().user;
      if (!user && Cookies.get("auth_token")) user = await syncUserWithBackend();
      if (!active) return;
      if (!user) {
        setGate("login");
        return;
      }
      if (!user.emailVerified) {
        setGate("email");
        return;
      }
      const smsVerificationEnabled = await fetchSmsVerificationEnabled();
      if (!active) return;
      setGate(smsVerificationEnabled && user.phoneVerified === false ? "phone" : "ready");
    };

    setGate("checking");
    void resolveAccess();
    return () => {
      active = false;
    };
  }, [storedUser?.emailVerified, storedUser?.id, storedUser?.phoneVerified]);

  if (gate === "checking") {
    return (
      <main className="session-check" role="status">
        <img src="/gamerie-logo.svg" alt="" />
        <span>Opening Gamerie</span>
        <i aria-hidden="true" />
      </main>
    );
  }
  if (gate === "login") return <Navigate to="/login" state={{ from: location }} replace />;
  if (gate === "email") return <Navigate to="/verify-email" replace />;
  if (gate === "phone") return <Navigate to="/verify-phone" replace />;
  if (allowedRoles && (!storedUser?.role || !allowedRoles.includes(storedUser.role.toLowerCase())))
    return <Navigate to="/login" replace />;
  return <>{children}</>;
}
