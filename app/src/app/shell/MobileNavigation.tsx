import { MoreHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../../features/auth/api";
import { mobileNavigation, secondaryNavigation } from "./navigation";

export function MobileNavigation() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
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

  return <>
    <nav className="mobile-nav" aria-label="Primary navigation">
      {mobileNavigation.map(({ href, icon: Icon, label }) => <NavLink key={href} to={href} className={({ isActive }) => isActive ? "is-active" : undefined}><Icon size={19} /><span>{label}</span></NavLink>)}
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open}><MoreHorizontal size={20} /><span>More</span></button>
    </nav>
    {open && <div className="mobile-more" role="dialog" aria-modal="true" aria-label="More navigation">
      <button className="mobile-more__scrim" type="button" onClick={() => setOpen(false)} aria-label="Close more menu" />
      <section className="mobile-more__sheet">
        <header><h2>More</h2><button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={19} /></button></header>
        <nav>{secondaryNavigation.map(({ href, icon: Icon, label }) => <NavLink key={href} to={href} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
        <button className="mobile-more__logout" type="button" onClick={() => void logout()}>Sign out</button>
      </section>
    </div>}
  </>;
}
