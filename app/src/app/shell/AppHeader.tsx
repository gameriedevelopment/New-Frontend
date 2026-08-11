import { ChevronDown, LogOut, MessageSquare, Search, Settings, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "../../features/auth/api";
import { useAuthStore } from "../../features/auth/authStore";
import { SafeImage } from "../../components/ui";
import { useTotalUnread } from "../../features/messages/hooks";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

function initials(username?: string, email?: string) {
  const source = username || email?.split("@")[0] || "G";
  return source.slice(0, 2).toUpperCase();
}

export function AppHeader() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const isAdmin = String(user?.role ?? "").toLowerCase() === "admin";
  const adminUrl = import.meta.env.VITE_ADMIN_URL || "http://localhost:5175";
  const unreadQuery = useTotalUnread();
  const unread = Number(unreadQuery.data ?? 0);

  useEffect(() => {
    if (!isProfileOpen) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && profileRef.current?.contains(event.target as Node)) return;
      setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key !== "/" || editing || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>("[data-global-search]");
      if (input) input.focus();
      else navigate("/search");
    };
    document.addEventListener("keydown", openSearch);
    return () => document.removeEventListener("keydown", openSearch);
  }, [navigate]);

  const logout = async () => {
    try {
      setLogoutError(null);
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Sign out failed. Please try again.");
    }
  };

  return (
    <header className="app-header">
      <Link className="app-header__mobile-brand" to="/feed" aria-label="Gamerie feed">
        <img src="/gamerie-logo.svg" alt="" />
        <span>Gamerie</span>
      </Link>
      <Link className="app-header__search" to="/search">
        <Search size={16} />
        <span>Search Gamerie</span>
        <kbd>/</kbd>
      </Link>
      <div className="app-header__actions">
        {isAdmin && (
          <a className="app-header__icon" href={adminUrl} aria-label="Open Gamerie Operations">
            <Shield size={18} />
          </a>
        )}
        <Link
          className="app-header__icon app-header__messages"
          to="/messages"
          aria-label={unread ? `Messages, ${unread} unread` : "Messages"}
        >
          <MessageSquare size={18} />
          {unread > 0 ? (
            <span className="app-header__badge">{unread > 99 ? "99+" : unread}</span>
          ) : null}
        </Link>
        <NotificationBell />
        <div className="app-profile" ref={profileRef}>
          <button
            className="app-profile__trigger"
            type="button"
            onClick={() => setIsProfileOpen((open) => !open)}
            aria-expanded={isProfileOpen}
          >
            {user?.profileImage ? (
              <SafeImage className="app-avatar app-avatar--image" src={user.profileImage} alt="" />
            ) : (
              <span className="app-avatar">{initials(user?.username, user?.email)}</span>
            )}
            <span className="app-profile__identity">
              <strong>{user?.username || "Player"}</strong>
              <small>{user?.email}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {isProfileOpen && (
            <div className="app-profile__menu">
              <Link
                to={`/profile/${user?.username ?? user?.id}`}
                onClick={() => setIsProfileOpen(false)}
              >
                View profile
              </Link>
              <Link to="/settings" onClick={() => setIsProfileOpen(false)}>
                <Settings size={15} />
                Settings
              </Link>
              <button type="button" onClick={logout}>
                <LogOut size={15} />
                Sign out
              </button>
              {logoutError && <p role="alert">{logoutError}</p>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
