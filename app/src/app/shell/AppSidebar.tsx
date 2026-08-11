import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { primaryNavigation, secondaryNavigation } from "./navigation";

function NavigationGroup({ label, items }: { label: string; items: typeof primaryNavigation }) {
  return (
    <div className="app-sidebar__group">
      <p>{label}</p>
      <nav aria-label={label}>
        {items.map(({ href, icon: Icon, label: itemLabel }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) => (isActive ? "is-active" : undefined)}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{itemLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className="app-sidebar">
      <NavLink className="app-sidebar__brand" to="/feed" aria-label="Gamerie feed">
        <img src="/gamerie-logo.svg" alt="" />
        <span>Gamerie</span>
      </NavLink>
      <div className="app-sidebar__navigation">
        <NavigationGroup label="Gamerie" items={primaryNavigation} />
        <NavigationGroup label="Your space" items={secondaryNavigation} />
      </div>
      <div className="app-sidebar__bottom">
        <button
          className="app-sidebar__collapse"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          <span>Collapse sidebar</span>
        </button>
        <p className="app-sidebar__footer">Play. Connect. Belong.</p>
      </div>
    </aside>
  );
}
