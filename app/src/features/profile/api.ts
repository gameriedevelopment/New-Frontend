import { api } from "../../lib/api";
import type { PlayerProfile } from "./types";

interface ApiEnvelope<T> { data: T; }

export async function getPlayerProfile(identity: string): Promise<PlayerProfile> {
  const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity);
  const endpoint = legacyId ? `/users/${identity}` : `/users/by-username/${encodeURIComponent(identity)}`;
  const { data } = await api.get<ApiEnvelope<PlayerProfile>>(endpoint);
  return data.data;
}

export async function followPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.post(`/users/${currentUserId}/follow/${targetUserId}`);
}

export async function unfollowPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.delete(`/users/${currentUserId}/unfollow/${targetUserId}`);
}

export async function updatePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
  const { data } = await api.patch<ApiEnvelope<PlayerProfile>>(`/users/${userId}`, updates);
  return data.data;
}

export async function uploadPlayerImage(userId: string, file: File, type: "profileImage" | "backgroundImage"): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  await api.post(`/users/${userId}/upload/${type}`, body, { headers: { "Content-Type": "multipart/form-data" } });
}
