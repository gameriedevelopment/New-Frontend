import { NavLink } from "react-router-dom";
import { primaryNavigation, secondaryNavigation } from "./navigation";

function NavigationGroup({ label, items }: { label: string; items: typeof primaryNavigation }) {
  return (
    <div className="app-sidebar__group">
      <p>{label}</p>
      <nav aria-label={label}>
        {items.map(({ href, icon: Icon, label: itemLabel }) => (
          <NavLink key={href} to={href} className={({ isActive }) => isActive ? "is-active" : undefined}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{itemLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="app-sidebar">
      <NavLink className="app-sidebar__brand" to="/feed" aria-label="Gamerie feed"><img src="/gamerie-logo.svg" alt="" /><span>Gamerie</span></NavLink>
      <div className="app-sidebar__navigation">
        <NavigationGroup label="Gamerie" items={primaryNavigation} />
        <NavigationGroup label="Your space" items={secondaryNavigation} />
      </div>
      <p className="app-sidebar__footer">Play. Connect. Belong.</p>
    </aside>
  );
}
