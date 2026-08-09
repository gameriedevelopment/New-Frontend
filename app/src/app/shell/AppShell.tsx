import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { useHeartbeat } from "./useHeartbeat";

export function AppShell() {
  useHeartbeat();
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="app-shell__workspace">
        <AppHeader />
        <main className="app-shell__content"><Outlet /></main>
      </div>
      <MobileNavigation />
    </div>
  );
}
