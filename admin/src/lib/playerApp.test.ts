import { describe, expect, it } from "vitest";
import { playerAppHref } from "./playerApp";

describe("playerAppHref", () => {
  it("builds encoded player-app routes without losing path segments", () => {
    const url = new URL(playerAppHref("profile", "player name/one"));

    expect(url.pathname).toBe("/profile/player%20name%2Fone");
  });
});
