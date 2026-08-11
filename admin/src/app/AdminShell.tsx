import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Brand } from "../components/Brand";
import { useAdminAuth } from "../features/auth/AuthProvider";
import "./shell.css";

export function AdminShell() {
  const { user, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar is-open" : "admin-sidebar"}>
        <div className="admin-sidebar__top">
          <Brand />
          <button
            className="admin-icon-button admin-sidebar__close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Operations navigation">
          <span className="admin-nav-label">Workspace</span>
          <NavLink to="/" end onClick={() => setOpen(false)}>
            <span>Overview</span>
          </NavLink>
          <NavLink to="/users" onClick={() => setOpen(false)}>
            <span>Users</span>
          </NavLink>
          <NavLink to="/teams" onClick={() => setOpen(false)}>
            <span>Teams</span>
          </NavLink>
          <NavLink to="/hubs" onClick={() => setOpen(false)}>
            <span>Hubs</span>
          </NavLink>
          {user?.isSuperAdmin ? (
            <NavLink to="/administrators" onClick={() => setOpen(false)}>
              <span>Administrators</span>
            </NavLink>
          ) : null}
        </nav>
        <div className="admin-sidebar__account">
          <div>
            <strong>{user?.username || "Administrator"}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="admin-icon-button" onClick={signOut} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-shell__main">
        <header className="admin-mobile-header">
          <Brand compact />
          <button
            className="admin-icon-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
