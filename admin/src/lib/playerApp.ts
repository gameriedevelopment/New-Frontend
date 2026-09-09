const PLAYER_APP_URL = import.meta.env.VITE_PLAYER_APP_URL || "http://localhost:5173";

export function playerAppHref(...segments: string[]): string {
  const base = PLAYER_APP_URL.endsWith("/") ? PLAYER_APP_URL : `${PLAYER_APP_URL}/`;
  const path = segments.map((segment) => encodeURIComponent(segment)).join("/");
  return new URL(path, base).toString();
}
