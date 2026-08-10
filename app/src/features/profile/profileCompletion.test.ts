import { describe, expect, it } from "vitest";
import { getProfileCompletion } from "./profileCompletion";

describe("profile completion", () => {
  it("preserves the original weighted contract and reports a missing game", () => {
    const result = getProfileCompletion({ profileImage: "avatar", backgroundImage: "cover", bio: "bio", gamerTitle: "Player", platforms: ["PC"], skills: [{ name: "Strategy" }], socialMedia: [{ platform: "Twitch" }] });
    expect(result.score).toBe(80);
    expect(result.missing.map((item) => item.id)).toEqual(["game"]);
  });

  it("requires non-empty values rather than truthy placeholders", () => {
    expect(getProfileCompletion({ profileImage: " ", platforms: [], games: [], skills: [] }).score).toBe(0);
  });
});
