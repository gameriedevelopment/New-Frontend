import { describe, expect, it } from "vitest";
import { GAME_PROVIDERS, riotProduct } from "./registry";

describe("game provider registry", () => {
  it("keeps every provider id unique", () => {
    const ids = GAME_PROVIDERS.map((provider) => provider.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("maps Riot providers to their backend product paths", () => {
    expect(riotProduct("league-of-legends")).toBe("lol");
    expect(riotProduct("teamfight-tactics")).toBe("tft");
    expect(riotProduct("valorant")).toBe("valorant");
  });
});
