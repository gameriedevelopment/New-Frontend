import { api } from "../../lib/api";
import type { PlayerSettings } from "./types";

interface ApiEnvelope<T> {
  data: T;
}

export async function getPlayerSettings(userId: string): Promise<PlayerSettings> {
  const { data } = await api.get<ApiEnvelope<PlayerSettings>>(`/users/settings/${userId}`);
  return data.data;
}

export async function updatePlayerSettings(
  userId: string,
  settings: PlayerSettings,
): Promise<PlayerSettings> {
  const { data } = await api.patch<ApiEnvelope<PlayerSettings>>(
    `/users/settings/${userId}`,
    settings,
  );
  return data.data;
}
