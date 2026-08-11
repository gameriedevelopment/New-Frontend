import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAccessBoundary } from "./features/auth/AdminAccessBoundary";
import { AdminSignInPage } from "./features/auth/AdminSignInPage";
import { AdminShell } from "./app/AdminShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { UsersPage } from "./features/users/UsersPage";
import { TeamsPage } from "./features/communities/TeamsPage";
import { HubsPage } from "./features/communities/HubsPage";
import { AdminsPage } from "./features/operators/AdminsPage";
import { AcceptAdminInvitePage } from "./features/operators/AcceptAdminInvitePage";
import { ModerationPage } from "./features/moderation/ModerationPage";
import { GamesPage } from "./features/games/GamesPage";
import { CompetitionPage } from "./features/competition/CompetitionPage";
import { FinanceGrowthPage } from "./features/finance/FinanceGrowthPage";
import { AuditPage } from "./features/audit/AuditPage";
import { CommunicationsPage } from "./features/communications/CommunicationsPage";
import { AnalyticsPage } from "./features/analytics/AnalyticsPage";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<AdminSignInPage />} />
      <Route path="/accept-invite" element={<AcceptAdminInvitePage />} />
      <Route element={<AdminAccessBoundary />}>
        <Route element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="hubs" element={<HubsPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="competition" element={<CompetitionPage />} />
          <Route path="finance" element={<FinanceGrowthPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="communications" element={<CommunicationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="administrators" element={<AdminsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
