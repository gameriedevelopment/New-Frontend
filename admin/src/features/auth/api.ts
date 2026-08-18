import Cookies from "js-cookie";
import { api } from "../../lib/api";
import { hasAdminRole, type AdminUser } from "./types";

interface Envelope<T> {
  data: T;
}

interface LoginResponse {
  token: string;
  user: AdminUser;
}

export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  const { data } = await api.post<Envelope<LoginResponse>>("/admin-auth/login", {
    email,
    password,
  });
  const { token, user } = data.data;

  if (!token || !user?.id) throw new Error("The server returned an incomplete sign-in response.");

  Cookies.set("admin_auth_token", token, {
    secure: window.location.protocol === "https:",
    sameSite: "Lax",
  });

  try {
    return await fetchAdminSession();
  } catch (error) {
    Cookies.remove("admin_auth_token");
    throw error;
  }
}

export async function fetchAdminSession(): Promise<AdminUser> {
  const { data } = await api.get<Envelope<AdminUser>>("/admin/session");
  if (!hasAdminRole(data.data)) throw new Error("This account does not have administrator access.");
  return data.data;
}

export function hasAdminCredential() {
  return Boolean(Cookies.get("admin_auth_token"));
}

export function clearAdminCredential() {
  Cookies.remove("admin_auth_token");
}
