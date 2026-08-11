import axios from "axios";

export function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const body = error.response?.data as { message?: string; error?: string } | undefined;
  return body?.message || body?.error || fallback;
}
