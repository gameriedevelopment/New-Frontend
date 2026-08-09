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
import { PageLoader } from "./components/ui";

const NewsFeedPage = lazy(() => import("./features/newsfeed/NewsFeedPage").then((module) => ({ default: module.NewsFeedPage })));
const SinglePostPage = lazy(() => import("./features/newsfeed/SinglePostPage").then((module) => ({ default: module.SinglePostPage })));
const MessagesPage = lazy(() => import("./features/messages/MessagesPage").then((module) => ({ default: module.MessagesPage })));
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function DeferredPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader label="Loading content" />}>{children}</Suspense>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-phone" element={<VerifyPhonePage />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
        <Route path="/confirm-email-change/:token" element={<ConfirmEmailChangePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/feed" element={<DeferredPage><NewsFeedPage /></DeferredPage>} />
          <Route path="/post/:postId" element={<DeferredPage><SinglePostPage /></DeferredPage>} />
          <Route path="/users" element={<FeatureFoundationPage />} />
          <Route path="/games" element={<FeatureFoundationPage />} />
          <Route path="/teams" element={<FeatureFoundationPage />} />
          <Route path="/hubs" element={<FeatureFoundationPage />} />
          <Route path="/messages" element={<DeferredPage><MessagesPage /></DeferredPage>} />
          <Route path="/tournaments" element={<FeatureFoundationPage />} />
          <Route path="/leaderboard" element={<FeatureFoundationPage />} />
          <Route path="/calendar" element={<FeatureFoundationPage />} />
          <Route path="/wallet" element={<FeatureFoundationPage />} />
          <Route path="/search" element={<FeatureFoundationPage />} />
          <Route path="/notifications" element={<DeferredPage><NotificationsPage /></DeferredPage>} />
          <Route path="/settings" element={<DeferredPage><SettingsPage /></DeferredPage>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><FeatureFoundationPage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<DeferredPage><ProfilePage /></DeferredPage>} />
        </Route>
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
