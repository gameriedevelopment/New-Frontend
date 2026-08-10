import { api, API_URL } from "../../../lib/api";
import type { GameConnection, GameProviderId, ProviderMetric } from "../types";
import { riotProduct } from "./registry";

interface ApiEnvelope<T> { data: T; }
export type ProviderConnectPayload = Record<string, unknown>;

export async function getGameConnections(): Promise<GameConnection[]> {
  const { data } = await api.get<ApiEnvelope<GameConnection[]>>("/game-connections");
  return data.data ?? [];
}

export async function connectProvider(provider: GameProviderId, payload: ProviderConnectPayload): Promise<GameConnection> {
  if (provider === "lichess") {
    const { data } = await api.post<ApiEnvelope<GameConnection>>(`/game-connections/${provider}`, payload);
    return data.data;
  }
  const endpoint = provider === "league-of-legends" || provider === "valorant" || provider === "teamfight-tactics" ? `/riot/${riotProduct(provider)}/connect` : provider === "steam" ? "/steam-connect/link" : `/${provider}/connect`;
  const { data } = await api.post<GameConnection>(endpoint, payload);
  return data;
}

export async function disconnectProvider(provider: GameProviderId): Promise<void> {
  if (provider === "lichess") {
    const token = sessionStorage.getItem("gamerie_lichess_access_token");
    if (token) await fetch("https://lichess.org/api/token", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
    sessionStorage.removeItem("gamerie_lichess_access_token");
    await api.delete(`/game-connections/${provider}`);
    return;
  }
  const endpoint = provider === "steam" ? "/steam-connect/link" : provider === "league-of-legends" || provider === "valorant" || provider === "teamfight-tactics" ? `/riot/${riotProduct(provider)}/connect` : `/${provider}/connect`;
  await api.delete(endpoint);
}

const read = (object: unknown, path: string): unknown => path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, object);
const display = (value: unknown): string | number => typeof value === "number" ? value.toLocaleString() : typeof value === "string" ? value : "—";
const metrics = (source: unknown, fields: Array<[string, string]>): ProviderMetric[] => fields.map(([label, path]) => ({ label, value: display(read(source, path)) })).filter((item) => item.value !== "—").slice(0, 4);

export async function getProviderMetrics(connection: GameConnection): Promise<ProviderMetric[]> {
  const id = encodeURIComponent(connection.providerAccountId);
  const handle = encodeURIComponent(connection.handle || connection.providerAccountId);
  const metadata = connection.metadata ?? {};
  if (connection.provider === "steam") return metrics({ connection }, [["Account", "connection.handle"], ["Steam profile", "connection.metadata.profileUrl"]]);
  if (connection.provider === "lichess") {
    const response = await fetch(`https://lichess.org/api/user/${handle}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Lichess statistics are unavailable right now.");
    const data = await response.json();
    return metrics(data, [["Rapid", "perfs.rapid.rating"], ["Blitz", "perfs.blitz.rating"], ["Games", "count.all"], ["Wins", "count.win"]]);
  }
  if (["clash-royale", "clash-of-clans", "brawl-stars"].includes(connection.provider)) {
    const { data } = await api.get(`/${connection.provider}/player/${id}`);
    return connection.provider === "clash-of-clans" ? metrics(data, [["Trophies", "trophies"], ["Town Hall", "townHallLevel"], ["War stars", "warStars"], ["Level", "expLevel"]]) : connection.provider === "brawl-stars" ? metrics(data, [["Trophies", "trophies"], ["Best", "highestTrophies"], ["3v3 wins", "3vs3Victories"], ["Brawlers", "brawlers.length"]]) : metrics(data, [["Trophies", "trophies"], ["Best", "bestTrophies"], ["Wins", "wins"], ["Level", "expLevel"]]);
  }
  if (connection.provider === "dota-2" || connection.provider === "cs2") {
    const { data } = await api.get(`/${connection.provider}/overview/${id}`);
    return connection.provider === "cs2" ? metrics(data, [["Wins", "summary.wins"], ["Kills", "summary.kills"], ["Headshots", "summary.headshots"], ["Achievements", "summary.achievementsUnlocked"]]) : metrics(data, [["Wins", "summary.wins"], ["Losses", "summary.losses"], ["Average kills", "summary.averageKills"], ["Recent matches", "recentMatchCount"]]);
  }
  if (connection.provider === "pubg") {
    const platform = encodeURIComponent(String(metadata.platform || "steam"));
    const { data } = await api.get(`/pubg/overview/${platform}/${handle}`);
    return metrics(data, [["Player", "player.attributes.name"], ["Platform", "platform"], ["Season", "currentSeason.id"], ["Recent matches", "latestMatches.length"]]);
  }
  if (connection.provider === "battlenet") {
    const region = encodeURIComponent(String(metadata.region || "us")); const realm = encodeURIComponent(String(metadata.realmId || "1")); const profile = encodeURIComponent(String(metadata.profileId || connection.providerAccountId));
    const { data } = await api.get(`/battlenet/sc2/profile/${region}/${realm}/${profile}`);
    return metrics(data, [["Player", "summary.displayName"], ["Clan", "summary.clanName"], ["Achievement points", "summary.achievementPoints"], ["Career games", "career.totalGames"]]);
  }
  const [gameName, tagLine] = (connection.handle || "").split("#");
  const region = String(metadata.region || "EUW");
  if (connection.provider === "league-of-legends") {
    const { data } = await api.get(`/riot/lol/ranked/${id}`, { params: { region } }); const first = Array.isArray(data) ? data[0] : data;
    return metrics(first, [["Rank", "tier"], ["LP", "leaguePoints"], ["Wins", "wins"], ["Losses", "losses"]]);
  }
  if (connection.provider === "valorant") {
    const { data } = await api.get(`/riot/valorant/mmr/${id}`, { params: { region } });
    return metrics(data, [["Rank", "current_data.currenttierpatched"], ["Rating", "current_data.ranking_in_tier"], ["Elo", "current_data.elo"], ["Level", "account_level"]]);
  }
  const { data } = await api.get(`/riot/tft/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine || "")}`, { params: { region } });
  return metrics(data, [["Level", "summoner.summonerLevel"], ["Name", "account.gameName"], ["Region", "region"]]);
}

const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const CONNECTION_STATE = "gamerie_connection_state";
const CONNECTION_PROVIDER = "gamerie_connection_provider";
const LICHESS_VERIFIER = "gamerie_lichess_verifier";
const CONNECTION_RETURN = "gamerie_connection_return";

export async function startRedirectConnection(provider: "steam" | "dota-2" | "cs2" | "lichess", returnTo: string) {
  const state = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  sessionStorage.setItem(CONNECTION_STATE, state); sessionStorage.setItem(CONNECTION_PROVIDER, provider); sessionStorage.setItem(CONNECTION_RETURN, returnTo);
  if (provider === "lichess") {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
    sessionStorage.setItem(LICHESS_VERIFIER, verifier);
    const redirectUri = `${window.location.origin}/lichess/connect/callback`;
    const clientId = import.meta.env.VITE_LICHESS_CLIENT_ID || window.location.origin;
    const url = new URL("https://lichess.org/oauth");
    url.search = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, scope: "preference:read email:read", state, code_challenge_method: "S256", code_challenge: challenge }).toString();
    window.location.assign(url);
    return;
  }
  const url = new URL(`${API_URL}/steam-connect/start`);
  url.searchParams.set("returnTo", `${window.location.origin}/steam/connect/callback`); url.searchParams.set("state", state);
  window.location.assign(url);
}

export function readConnectionCallback() {
  const storedReturn = sessionStorage.getItem(CONNECTION_RETURN);
  const returnTo = storedReturn?.startsWith("/") && !storedReturn.startsWith("//") ? storedReturn : "/feed";
  return { state: sessionStorage.getItem(CONNECTION_STATE), provider: sessionStorage.getItem(CONNECTION_PROVIDER) as GameProviderId | null, returnTo, verifier: sessionStorage.getItem(LICHESS_VERIFIER) };
}
export function clearConnectionCallback() { [CONNECTION_STATE, CONNECTION_PROVIDER, CONNECTION_RETURN, LICHESS_VERIFIER].forEach((key) => sessionStorage.removeItem(key)); }

export async function finishLichessConnection(code: string, verifier: string): Promise<GameConnection> {
  const redirectUri = `${window.location.origin}/lichess/connect/callback`; const clientId = import.meta.env.VITE_LICHESS_CLIENT_ID || window.location.origin;
  const tokenResponse = await fetch("https://lichess.org/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri, client_id: clientId }) });
  if (!tokenResponse.ok) throw new Error("Lichess could not verify this connection.");
  const token = await tokenResponse.json() as { access_token: string };
  const accountResponse = await fetch("https://lichess.org/api/account", { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" } });
  if (!accountResponse.ok) throw new Error("The connected Lichess account could not be read.");
  const account = await accountResponse.json() as { id: string; username: string };
  sessionStorage.setItem("gamerie_lichess_access_token", token.access_token);
  return connectProvider("lichess", { providerAccountId: account.id, handle: account.username, metadata: { source: "oauth" } });
}
