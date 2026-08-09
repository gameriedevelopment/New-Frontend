import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
          <Route path="/feed" element={<FeatureFoundationPage />} />
          <Route path="/users" element={<FeatureFoundationPage />} />
          <Route path="/games" element={<FeatureFoundationPage />} />
          <Route path="/teams" element={<FeatureFoundationPage />} />
          <Route path="/hubs" element={<FeatureFoundationPage />} />
          <Route path="/messages" element={<FeatureFoundationPage />} />
          <Route path="/tournaments" element={<FeatureFoundationPage />} />
          <Route path="/leaderboard" element={<FeatureFoundationPage />} />
          <Route path="/calendar" element={<FeatureFoundationPage />} />
          <Route path="/wallet" element={<FeatureFoundationPage />} />
          <Route path="/search" element={<FeatureFoundationPage />} />
          <Route path="/notifications" element={<FeatureFoundationPage />} />
          <Route path="/settings" element={<FeatureFoundationPage />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><FeatureFoundationPage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<FeatureFoundationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
