import { Outlet } from "react-router-dom";
import { useState } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { useHeartbeat } from "./useHeartbeat";

export function AppShell() {
  useHeartbeat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("Gamerie_sidebar_collapsed") === "true",
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("Gamerie_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="app-shell" data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}>
      <a className="app-skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="app-shell__workspace">
        <AppHeader />
        <main className="app-shell__content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
