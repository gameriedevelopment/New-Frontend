import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { api } from "../../lib/api";
import { useAuthStore } from "./authStore";
import type { AuthUser, LoginResult } from "./types";

export type SocialProvider = "google" | "facebook" | "discord" | "apple";

export interface RegistrationPayload {
  email: string;
  password: string;
  username: string;
  role: "user";
  gamerTitle: "Player" | "Streamer" | "Spectator" | "Coach" | "Trainer" | "Analyst";
  gameLevel: "Hobbyist" | "Amateur" | "Advanced" | "Competitor" | "Pro";
  platforms: Array<"PC" | "XBOX" | "PS5" | "Switch" | "Mobile">;
  termsAccepted: boolean;
  dateOfBirth: string;
  referralCode?: string;
  turnstileToken?: string;
}

interface LoginEnvelope {
  data: {
    token: string;
    user: AuthUser;
  };
}

interface ProfileEnvelope {
  data: AuthUser;
}

interface RegistrationEnvelope {
  data: {
    user: AuthUser;
    token?: string;
  };
}

export async function registerAccount(payload: RegistrationPayload): Promise<AuthUser> {
  const { data: response } = await api.post<RegistrationEnvelope>("/auth/register", payload);
  const { user, token } = response.data;

  if (!user?.id) throw new Error("The server returned an incomplete registration response.");

  if (token) {
    const decoded = jwtDecode<{ exp?: number }>(token);
    Cookies.set("auth_token", token, {
      secure: window.location.protocol === "https:",
      sameSite: "Lax",
      ...(decoded.exp ? { expires: new Date(decoded.exp * 1000) } : {}),
    });
  }

  useAuthStore.getState().setUser(user, false);
  sessionStorage.setItem("Gamerie_pending_email", user.email ?? payload.email);
  return user;
}

export async function requestPasswordReset(email: string, turnstileToken?: string): Promise<void> {
  await api.post(
    `/auth/forgot-password/${encodeURIComponent(email)}`,
    {},
    turnstileToken ? { headers: { "cf-turnstile-response": turnstileToken } } : undefined,
  );
}

export async function confirmPasswordReset(payload: {
  password: string;
  confirmPassword: string;
  resetToken: string;
}): Promise<void> {
  await api.post("/auth/reset-password", payload);
}

export async function resendConfirmationEmail(
  email: string,
  turnstileToken?: string,
): Promise<void> {
  await api.post(
    `/auth/resend-confirmation/${encodeURIComponent(email)}`,
    {},
    turnstileToken ? { headers: { "cf-turnstile-response": turnstileToken } } : undefined,
  );
}

export async function confirmEmail(token: string): Promise<AuthUser> {
  const { data: response } = await api.post<RegistrationEnvelope>(
    `/auth/confirm-email/${encodeURIComponent(token)}`,
  );
  const authToken = response.data.token;
  const responseUser = response.data.user;

  if (authToken) {
    const decoded = jwtDecode<{ exp?: number }>(authToken);
    Cookies.set("auth_token", authToken, {
      secure: window.location.protocol === "https:",
      sameSite: "Lax",
      ...(decoded.exp ? { expires: new Date(decoded.exp * 1000) } : {}),
    });
  }

  if (!responseUser?.id)
    throw new Error("The server returned an incomplete confirmation response.");
  const { data: profileResponse } = await api.get<ProfileEnvelope>(`/users/${responseUser.id}`);
  useAuthStore.getState().setUser(profileResponse.data);
  return profileResponse.data;
}

export async function fetchSmsVerificationEnabled(): Promise<boolean> {
  try {
    const { data } = await api.get<{ data?: { smsVerificationEnabled?: boolean } }>(
      "/verification/status",
    );
    return data.data?.smsVerificationEnabled ?? true;
  } catch {
    return true;
  }
}

export async function sendPhoneCode(phoneNumber: string): Promise<void> {
  await api.post("/verification/phone/send", { phoneNumber });
}

export async function checkPhoneCode(phoneNumber: string, code: string): Promise<void> {
  await api.post("/verification/phone/check", { phoneNumber, code });
}

export async function syncUserWithBackend(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{ data: AuthUser }>("/users/current-user/sync");
    useAuthStore.getState().setUser(data.data);
    return data.data;
  } catch {
    return null;
  }
}

export async function confirmEmailChange(token: string): Promise<{ email: string }> {
  const { data } = await api.post<{ data: { email: string } }>(
    `/auth/confirm-email-change/${encodeURIComponent(token)}`,
  );
  return data.data;
}

export async function requestEmailChange(newEmail: string, currentPassword: string): Promise<void> {
  await api.post("/auth/change-email", { newEmail, currentPassword, origin: "app" });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  await api.post("/auth/change-password", { currentPassword, newPassword, confirmPassword });
}

export function beginSocialAuth(provider: SocialProvider): void {
  if (provider === "apple") return;
  window.location.assign(`${api.defaults.baseURL}/auth/${provider}`);
}

export async function fetchUserProfile(userId: string): Promise<AuthUser> {
  const { data } = await api.get<ProfileEnvelope>(`/users/${encodeURIComponent(userId)}`);
  return data.data;
}

export async function updateSocialProfile(
  userId: string,
  updates: {
    username: string;
    gamerTitle: RegistrationPayload["gamerTitle"];
    gameLevel: RegistrationPayload["gameLevel"];
    platforms: RegistrationPayload["platforms"];
  },
): Promise<void> {
  await api.patch(`/users/${encodeURIComponent(userId)}`, updates);
}

export async function signOut(): Promise<void> {
  await api.post("/auth/logout");
  Cookies.remove("auth_token");
  useAuthStore.getState().clearUser();
}

export async function signIn(
  email: string,
  password: string,
  remember: boolean,
): Promise<LoginResult> {
  const { data: response } = await api.post<LoginEnvelope>("/auth/login", { email, password });
  const { token, user: loginUser } = response.data;

  if (!token || !loginUser?.id)
    throw new Error("The server returned an incomplete sign-in response.");

  const decoded = jwtDecode<{ exp?: number }>(token);
  Cookies.set("auth_token", token, {
    secure: window.location.protocol === "https:",
    sameSite: "Lax",
    ...(decoded.exp ? { expires: new Date(decoded.exp * 1000) } : {}),
  });

  try {
    const { data: profileResponse } = await api.get<ProfileEnvelope>(`/users/${loginUser.id}`);
    const user = profileResponse.data;
    useAuthStore.getState().setUser(user, remember);
    const smsVerificationEnabled = await fetchSmsVerificationEnabled();
    return {
      user,
      next: smsVerificationEnabled && user.phoneVerified === false ? "verify-phone" : "feed",
    };
  } catch (error) {
    Cookies.remove("auth_token");
    throw error;
  }
}
