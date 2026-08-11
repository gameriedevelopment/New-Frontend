import { MoreHorizontal, Settings, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../../features/auth/api";
import { useAuthStore } from "../../features/auth/authStore";
import { useTotalUnread } from "../../features/messages/hooks";
import { mobileMoreNavigation, mobileNavigation } from "./navigation";

export function MobileNavigation() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const unread = Number(useTotalUnread().data ?? 0);
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const logout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setOpen(false);
    }
  };

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {mobileNavigation.map(({ href, icon: Icon, label }) => (
          <NavLink
            key={href}
            to={href}
            aria-label={href === "/messages" && unread ? `${label}, ${unread} unread` : label}
            className={({ isActive }) => (isActive ? "is-active" : undefined)}
          >
            <Icon size={19} />
            <span>{label}</span>
            {href === "/messages" && unread ? (
              <b aria-hidden="true">{unread > 99 ? "99+" : unread}</b>
            ) : null}
          </NavLink>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open}>
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
      {open && (
        <div className="mobile-more" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            className="mobile-more__scrim"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close more menu"
          />
          <section className="mobile-more__sheet" ref={sheetRef}>
            <header>
              <h2>More on Gamerie</h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </header>
            <div className="mobile-more__group">
              <p>Account</p>
              <nav>
                <NavLink
                  to={`/profile/${user?.username ?? user?.id}`}
                  onClick={() => setOpen(false)}
                >
                  <UserRound size={18} />
                  <span>Profile</span>
                </NavLink>
                <NavLink to="/settings" onClick={() => setOpen(false)}>
                  <Settings size={18} />
                  <span>Settings</span>
                </NavLink>
              </nav>
            </div>
            <div className="mobile-more__group">
              <p>Explore</p>
              <nav>
                {mobileMoreNavigation.map(({ href, icon: Icon, label }) => (
                  <NavLink key={href} to={href} onClick={() => setOpen(false)}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
            <button className="mobile-more__logout" type="button" onClick={() => void logout()}>
              Sign out
            </button>
          </section>
        </div>
      )}
    </>
  );
}
