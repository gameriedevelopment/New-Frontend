import type { MatchHistoryEntry } from "./types";

function displayText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function structuredResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as { winnerId?: unknown; score?: unknown; notes?: unknown };
}

export function getMatchPresentation(match: MatchHistoryEntry, playerId: string) {
  const result = structuredResult(match.result);
  const status = displayText(match.status) || "Scheduled";
  const label =
    displayText(match.score) || displayText(result?.score) || displayText(match.result) || status;

  let state = displayText(match.result)?.toLowerCase() || status.toLowerCase();
  const winnerId = displayText(result?.winnerId);
  const isPlayerMatch = match.challengerId === playerId || match.challengedId === playerId;
  if (winnerId === playerId) state = "win";
  else if (winnerId && isPlayerMatch) state = "loss";

  const opponent =
    displayText(match.opponent) ||
    (match.challengerId === playerId
      ? displayText(match.challengedName)
      : match.challengedId === playerId
        ? displayText(match.challengerName)
        : null);

  return { label, state, opponent };
}
