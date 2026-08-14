import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { PasswordRecoveryPage } from "./features/auth/PasswordRecoveryPage";
import { ConfirmEmailChangePage } from "./features/auth/ConfirmEmailChangePage";
import { ConfirmEmailPage } from "./features/auth/ConfirmEmailPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { SignInPage } from "./features/auth/SignInPage";
import { VerifyEmailPage } from "./features/auth/VerifyEmailPage";
import { VerifyPhonePage } from "./features/auth/VerifyPhonePage";
import { AuthCallbackPage } from "./features/auth/AuthCallbackPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { AppShell } from "./app/shell/AppShell";
import { FeatureFoundationPage } from "./app/shell/FeatureFoundationPage";
import { AdminHandoffPage } from "./app/shell/AdminHandoffPage";
import { PageLoader } from "./components/ui";
import { AnalyticsRouteTracker } from "./features/privacy/CookieConsent";

const NewsFeedPage = lazy(() =>
  import("./features/newsfeed/NewsFeedPage").then((module) => ({ default: module.NewsFeedPage })),
);
const SinglePostPage = lazy(() =>
  import("./features/newsfeed/SinglePostPage").then((module) => ({
    default: module.SinglePostPage,
  })),
);
const MessagesPage = lazy(() =>
  import("./features/messages/MessagesPage").then((module) => ({ default: module.MessagesPage })),
);
const NotificationsPage = lazy(() =>
  import("./features/notifications/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const PlayerCardPage = lazy(() =>
  import("./features/profile/PlayerCardPage").then((module) => ({
    default: module.PlayerCardPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const PlayersPage = lazy(() =>
  import("./features/discovery/PlayersPage").then((module) => ({ default: module.PlayersPage })),
);
const SearchPage = lazy(() =>
  import("./features/discovery/SearchPage").then((module) => ({ default: module.SearchPage })),
);
const GamesPage = lazy(() =>
  import("./features/games/GamesPage").then((module) => ({ default: module.GamesPage })),
);
const GameDetailPage = lazy(() =>
  import("./features/games/GameDetailPage").then((module) => ({ default: module.GameDetailPage })),
);
const CommunityDirectoryPage = lazy(() =>
  import("./features/communities/CommunityDirectoryPage").then((module) => ({
    default: module.CommunityDirectoryPage,
  })),
);
const CommunityDetailPage = lazy(() =>
  import("./features/communities/CommunityDetailPage").then((module) => ({
    default: module.CommunityDetailPage,
  })),
);
const CommunityFormPage = lazy(() =>
  import("./features/communities/CommunityFormPage").then((module) => ({
    default: module.CommunityFormPage,
  })),
);
const SteamConnectionCallbackPage = lazy(() =>
  import("./features/games/connections/SteamConnectionCallbackPage").then((module) => ({
    default: module.SteamConnectionCallbackPage,
  })),
);
const LichessConnectionCallbackPage = lazy(() =>
  import("./features/games/connections/LichessConnectionCallbackPage").then((module) => ({
    default: module.LichessConnectionCallbackPage,
  })),
);
const ChallengesPage = lazy(() =>
  import("./features/challenges/ChallengesPage").then((module) => ({
    default: module.ChallengesPage,
  })),
);
const TournamentsPage = lazy(() =>
  import("./features/tournaments/TournamentsPage").then((module) => ({
    default: module.TournamentsPage,
  })),
);
const LeaderboardPage = lazy(() =>
  import("./features/leaderboard/LeaderboardPage").then((module) => ({
    default: module.LeaderboardPage,
  })),
);
const CalendarPage = lazy(() =>
  import("./features/calendar/CalendarPage").then((module) => ({ default: module.CalendarPage })),
);
const WalletPage = lazy(() =>
  import("./features/wallet/WalletPage").then((module) => ({ default: module.WalletPage })),
);

function DeferredPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading content" />}>{children}</Suspense>;
}

export function App() {
  return (
    <BrowserRouter>
      <AnalyticsRouteTracker />
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-phone" element={<VerifyPhonePage />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/confirm-email-change/:token" element={<ConfirmEmailChangePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/card/:username"
          element={
            <DeferredPage>
              <PlayerCardPage />
            </DeferredPage>
          }
        />
        <Route
          path="/s/:username"
          element={
            <DeferredPage>
              <PlayerCardPage />
            </DeferredPage>
          }
        />
        <Route
          path="/steam/connect/callback"
          element={
            <DeferredPage>
              <SteamConnectionCallbackPage />
            </DeferredPage>
          }
        />
        <Route
          path="/lichess/connect/callback"
          element={
            <DeferredPage>
              <LichessConnectionCallbackPage />
            </DeferredPage>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/feed"
            element={
              <DeferredPage>
                <NewsFeedPage />
              </DeferredPage>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <DeferredPage>
                <SinglePostPage />
              </DeferredPage>
            }
          />
          <Route
            path="/users"
            element={
              <DeferredPage>
                <PlayersPage />
              </DeferredPage>
            }
          />
          <Route
            path="/games"
            element={
              <DeferredPage>
                <GamesPage />
              </DeferredPage>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <DeferredPage>
                <GameDetailPage />
              </DeferredPage>
            }
          />
          <Route
            path="/teams"
            element={
              <DeferredPage>
                <CommunityDirectoryPage kind="teams" />
              </DeferredPage>
            }
          />
          <Route
            path="/teams/create"
            element={
              <DeferredPage>
                <CommunityFormPage kind="team" mode="create" />
              </DeferredPage>
            }
          />
          <Route
            path="/teams/:communitySlug/edit"
            element={
              <DeferredPage>
                <CommunityFormPage kind="team" mode="edit" />
              </DeferredPage>
            }
          />
          <Route
            path="/teams/:communitySlug"
            element={
              <DeferredPage>
                <CommunityDetailPage kind="team" />
              </DeferredPage>
            }
          />
          <Route
            path="/hubs"
            element={
              <DeferredPage>
                <CommunityDirectoryPage kind="hubs" />
              </DeferredPage>
            }
          />
          <Route
            path="/hubs/create"
            element={
              <DeferredPage>
                <CommunityFormPage kind="hub" mode="create" />
              </DeferredPage>
            }
          />
          <Route
            path="/hubs/:communitySlug/edit"
            element={
              <DeferredPage>
                <CommunityFormPage kind="hub" mode="edit" />
              </DeferredPage>
            }
          />
          <Route
            path="/hubs/:communitySlug"
            element={
              <DeferredPage>
                <CommunityDetailPage kind="hub" />
              </DeferredPage>
            }
          />
          <Route
            path="/messages"
            element={
              <DeferredPage>
                <MessagesPage />
              </DeferredPage>
            }
          />
          <Route
            path="/challenges"
            element={
              <DeferredPage>
                <ChallengesPage />
              </DeferredPage>
            }
          />
          <Route
            path="/challenges/:challengeId"
            element={
              <DeferredPage>
                <ChallengesPage />
              </DeferredPage>
            }
          />
          <Route
            path="/tournaments"
            element={
              <DeferredPage>
                <TournamentsPage />
              </DeferredPage>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <DeferredPage>
                <LeaderboardPage />
              </DeferredPage>
            }
          />
          <Route
            path="/calendar"
            element={
              <DeferredPage>
                <CalendarPage />
              </DeferredPage>
            }
          />
          <Route
            path="/wallet"
            element={
              <DeferredPage>
                <WalletPage />
              </DeferredPage>
            }
          />
          <Route
            path="/search"
            element={
              <DeferredPage>
                <SearchPage />
              </DeferredPage>
            }
          />
          <Route
            path="/notifications"
            element={
              <DeferredPage>
                <NotificationsPage />
              </DeferredPage>
            }
          />
          <Route
            path="/settings"
            element={
              <DeferredPage>
                <SettingsPage />
              </DeferredPage>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHandoffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <DeferredPage>
                <ProfilePage />
              </DeferredPage>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
