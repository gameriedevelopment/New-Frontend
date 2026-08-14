import { buildPlayerCardModel } from "../src/features/profile/playerCard";
import type { PlayerProfile } from "../src/features/profile/types";

export const config = { runtime: "edge" };

interface ApiEnvelope<T> {
  data: T;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!,
  );
}

function apiBaseUrl(request: Request) {
  return (process.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
}

async function fetchCard(request: Request, username: string) {
  const response = await fetch(
    `${apiBaseUrl(request)}/users/public-card/${encodeURIComponent(username)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as ApiEnvelope<PlayerProfile>;
  return body.data?.shareable ? body.data : null;
}

export default async function handler(request: Request) {
  const requestUrl = new URL(request.url);
  const username = requestUrl.searchParams.get("username")?.trim().slice(0, 80);
  if (!username) return new Response("Missing username", { status: 400 });
  const profile = await fetchCard(request, username);
  if (!profile) return new Response("Player card unavailable", { status: 404 });

  const model = buildPlayerCardModel(profile);
  const origin = requestUrl.origin;
  const cardUrl = `${origin}/card/${encodeURIComponent(model.username)}`;
  const shareUrl = `${origin}/s/${encodeURIComponent(model.username)}`;
  const imageUrl = `${origin}/api/card-image?username=${encodeURIComponent(model.username)}`;
  const title = `${model.username} — Gamerie player card`;
  const description = `${model.title}${model.game ? ` · ${model.game.name}` : ""}. View this player identity on Gamerie.`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="Gamerie" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(`${model.username}'s Gamerie player card`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="canonical" href="${escapeHtml(shareUrl)}" />
    <script>window.location.replace(${JSON.stringify(cardUrl).replace(/</g, "\\u003c")});</script>
    <style>
      :root{color-scheme:dark;font-family:system-ui,sans-serif;background:#08090d;color:#f5f3f8}
      body{min-height:100vh;margin:0;display:grid;place-items:center;text-align:center}
      a{min-height:44px;padding:0 18px;display:inline-flex;align-items:center;border-radius:7px;background:#b7a1ff;color:#08090d;font-weight:700;text-decoration:none}
    </style>
  </head>
  <body><main><p>Opening ${escapeHtml(model.username)}'s Gamerie player card…</p><a href="${escapeHtml(cardUrl)}">Open player card</a></main></body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
