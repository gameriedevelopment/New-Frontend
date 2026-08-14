import { ImageResponse } from "@vercel/og";
import { buildPlayerCardModel } from "../src/features/profile/playerCard";
import type { PlayerProfile } from "../src/features/profile/types";

export const config = { runtime: "edge" };

interface ApiEnvelope<T> {
  data: T;
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

function initials(username: string) {
  return (
    username
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}

function statColor(tone: string) {
  if (tone === "achievement") return "#dbc48a";
  if (tone === "brand") return "#b7a1ff";
  return "#f5f3f8";
}

export default async function handler(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().slice(0, 80);
  if (!username) return new Response("Missing username", { status: 400 });
  const profile = await fetchCard(request, username);
  if (!profile) return new Response("Player card unavailable", { status: 404 });
  const model = buildPlayerCardModel(profile);

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "62px 72px",
        flexDirection: "column",
        background: "#08090d",
        color: "#f5f3f8",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          display: "flex",
          height: 6,
          background: "#dbc48a",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 30, fontWeight: 700 }}>Gamerie</span>
        <span style={{ color: "#dbc48a", fontSize: 15, fontWeight: 700, letterSpacing: "0.16em" }}>
          PLAYER CARD
        </span>
      </div>
      <div style={{ display: "flex", marginTop: 54, alignItems: "center" }}>
        {model.profileImage ? (
          <img
            src={model.profileImage}
            width={148}
            height={148}
            alt=""
            style={{ border: "3px solid #b7a1ff", borderRadius: 999, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: 148,
              height: 148,
              border: "3px solid #b7a1ff",
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              background: "#141821",
              color: "#b7a1ff",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            {initials(model.username)}
          </div>
        )}
        <div style={{ display: "flex", minWidth: 0, marginLeft: 34, flexDirection: "column" }}>
          <span
            style={{ color: "#686473", fontSize: 14, fontWeight: 700, letterSpacing: "0.12em" }}
          >
            PLAYER IDENTITY
          </span>
          <span style={{ marginTop: 5, fontSize: 62, fontWeight: 720, letterSpacing: "-0.055em" }}>
            {model.username}
          </span>
          <span style={{ marginTop: 5, color: "#b7a1ff", fontSize: 22, fontWeight: 650 }}>
            {model.title}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 46, gap: 14 }}>
        {(model.stats.length
          ? model.stats
          : [
              {
                key: "empty",
                value: "—",
                label: "Statistics",
                context: "Not recorded yet",
                tone: "neutral" as const,
              },
            ]
        ).map((stat) => (
          <div
            key={stat.key}
            style={{
              display: "flex",
              minWidth: 0,
              padding: "22px 25px",
              flex: 1,
              flexDirection: "column",
              border: stat.tone === "achievement" ? "1px solid #6c5a36" : "1px solid #252b39",
              borderRadius: 14,
              background: stat.tone === "achievement" ? "#17150f" : "#10131a",
            }}
          >
            <span style={{ color: statColor(stat.tone), fontSize: 36, fontWeight: 720 }}>
              {stat.value}
            </span>
            <span style={{ marginTop: 8, fontSize: 16, fontWeight: 650 }}>{stat.label}</span>
            <span style={{ marginTop: 5, color: "#686473", fontSize: 12 }}>{stat.context}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          paddingTop: 25,
          borderTop: "1px solid #252b39",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#dbc48a", fontSize: 20, fontWeight: 700 }}>gamerie.gg</span>
        <span style={{ color: "#686473", fontSize: 14 }}>Identity · community · competition</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    },
  );
}
