import type { GameProviderId } from "../types";

export type ProviderConnectKind = "tag" | "riot" | "pubg" | "steam" | "battlenet" | "lichess";

export interface ProviderDefinition {
  id: GameProviderId;
  name: string;
  family: string;
  description: string;
  connectKind: ProviderConnectKind;
  initials: string;
  accent: string;
}

export const GAME_PROVIDERS: ProviderDefinition[] = [
  {
    id: "steam",
    name: "Steam",
    family: "PC identity",
    description: "Verify the Steam account behind your PC game activity.",
    connectKind: "steam",
    initials: "ST",
    accent: "#78a9d4",
  },
  {
    id: "lichess",
    name: "Lichess",
    family: "Chess",
    description: "Connect your public chess identity and rating history.",
    connectKind: "lichess",
    initials: "LI",
    accent: "#d6d0c5",
  },
  {
    id: "league-of-legends",
    name: "League of Legends",
    family: "Riot Games",
    description: "Bring ranked League activity into your player identity.",
    connectKind: "riot",
    initials: "LE",
    accent: "#c89b3c",
  },
  {
    id: "valorant",
    name: "Valorant",
    family: "Riot Games",
    description: "Verify your Riot ID and competitive Valorant profile.",
    connectKind: "riot",
    initials: "VA",
    accent: "#ff6978",
  },
  {
    id: "teamfight-tactics",
    name: "Teamfight Tactics",
    family: "Riot Games",
    description: "Connect your TFT summoner and ranked progression.",
    connectKind: "riot",
    initials: "TF",
    accent: "#67c6d4",
  },
  {
    id: "dota-2",
    name: "Dota 2",
    family: "Steam",
    description: "Use Steam OpenID to verify Dota 2 activity.",
    connectKind: "steam",
    initials: "D2",
    accent: "#c56b63",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    family: "Steam",
    description: "Use Steam OpenID to verify CS2 statistics.",
    connectKind: "steam",
    initials: "CS",
    accent: "#d9a256",
  },
  {
    id: "pubg",
    name: "PUBG",
    family: "KRAFTON",
    description: "Verify a PUBG account by platform and player name.",
    connectKind: "pubg",
    initials: "PG",
    accent: "#e7b84f",
  },
  {
    id: "clash-royale",
    name: "Clash Royale",
    family: "Supercell",
    description: "Connect using the player tag shown in your profile.",
    connectKind: "tag",
    initials: "CR",
    accent: "#5ca2e6",
  },
  {
    id: "clash-of-clans",
    name: "Clash of Clans",
    family: "Supercell",
    description: "Verify your village through its player tag.",
    connectKind: "tag",
    initials: "CC",
    accent: "#d99b53",
  },
  {
    id: "brawl-stars",
    name: "Brawl Stars",
    family: "Supercell",
    description: "Connect your Brawl Stars tag and battle profile.",
    connectKind: "tag",
    initials: "BS",
    accent: "#efbd3f",
  },
  {
    id: "battlenet",
    name: "Battle.net",
    family: "StarCraft II",
    description: "Verify a StarCraft II profile using its public locator.",
    connectKind: "battlenet",
    initials: "BN",
    accent: "#4ba6e8",
  },
];

export const getProvider = (provider: GameProviderId) =>
  GAME_PROVIDERS.find((item) => item.id === provider)!;
export const riotProduct = (provider: GameProviderId) =>
  provider === "league-of-legends" ? "lol" : provider === "teamfight-tactics" ? "tft" : "valorant";
