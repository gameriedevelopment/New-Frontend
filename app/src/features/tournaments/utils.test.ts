import { describe, expect, it } from "vitest";
import type { Tournament } from "./types";
import { getTournamentTiming, safeTournamentUrl, tournamentRequirements } from "./utils";

const base: Tournament = {
  id: "tournament-1",
  name: "Open Cup",
  game: "Valorant",
  platform: "PC",
  startDate: "2026-08-20T18:00:00.000Z",
  endDate: "2026-08-21T18:00:00.000Z",
  registrationDeadline: "2026-08-15T18:00:00.000Z",
  currentTeams: 4,
  maxTeams: 16,
};

describe("getTournamentTiming", () => {
  it("distinguishes open registration from lifecycle status", () => {
    expect(getTournamentTiming(base, new Date("2026-08-10T18:00:00.000Z"))).toEqual({
      lifecycle: "upcoming",
      registration: "open",
      registrationLabel: "Registration open",
    });
  });

  it("closes registration when capacity is reached", () => {
    expect(
      getTournamentTiming({ ...base, currentTeams: 16 }, new Date("2026-08-10T18:00:00.000Z"))
        .registration,
    ).toBe("full");
  });

  it("does not call an ongoing tournament open for registration", () => {
    expect(getTournamentTiming(base, new Date("2026-08-20T19:00:00.000Z"))).toEqual({
      lifecycle: "ongoing",
      registration: "started",
      registrationLabel: "In progress",
    });
  });
});

describe("tournamentRequirements", () => {
  it("uses explicit requirement language when fields are missing", () => {
    expect(tournamentRequirements(base)).toEqual(["All skill levels", "Open team size", "Global"]);
  });
});

describe("safeTournamentUrl", () => {
  it("only permits web registration links", () => {
    expect(safeTournamentUrl("https://example.com/register")).toBe("https://example.com/register");
    expect(safeTournamentUrl("javascript:alert(1)")).toBeUndefined();
  });
});
