import { describe, expect, it } from "vitest";
import type { Club, Fixture, IntelXi } from "@epl/core";
import { xiColumn } from "./xi";

// Four clubs in two matches, eleven men each: a gameweek small enough to read.
const SHORT = ["ARS", "LEE", "CHE", "BOU"];
const clubs = new Map<number, Club>(SHORT.map((shortName, at) => [at + 1, { id: at + 1, code: at + 1, name: shortName, shortName } as Club]));
const squad = (club: number) => Array.from({ length: 11 }, (_, at) => club * 100 + at);
// Man100 is out (Isak on 9 Oct: `i`, 0%, "Thigh injury"), Man101 a doubt at 50%, the rest fit.
const fitness = (code: number) =>
  code === 100
    ? { status: "i", news: "Thigh injury - Unknown return date", chanceOfPlaying: 0 }
    : code === 101
      ? { status: "d", news: "Knock - 50% chance of playing", chanceOfPlaying: 50 }
      : { status: "a", news: "", chanceOfPlaying: null };
const players = SHORT.flatMap((_, at) => squad(at + 1)).map((code) => ({ code, name: `Man${code}`, fullName: `First Man${code}`, ...fitness(code) }));
const eleven = (club: number) => ({ formation: "4-4-2", slots: { "1": 1, "2": 4, "3": 4, "4": 2 }, starters: squad(club).map((code) => ({ code, prob: 0.9 })) });
const season = [
  { gameweek: 6, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T11:30:00Z" },
  { gameweek: 6, homeClubId: 3, awayClubId: 4, kickoff: "2026-10-10T14:00:00Z" },
] as Fixture[];
// A season no export is held for, so no squads file is read.
const xiOf = (elevens: Record<string, ReturnType<typeof eleven>>) =>
  ({ manifest: { season: "none", gameweek: 6, exportedAt: "", rows: 4, sources: [] }, fetchedAt: null, source: null, clubs: elevens }) as IntelXi;
const column = (xi: IntelXi) => xiColumn({ xi, gameweek: 6, clubs, teams: [], players, season });

describe("xiColumn", () => {
  it("calls the week a gameweek in its deck and body, never a round", () => {
    const filed = column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }));
    expect(filed?.deck).toBe("Every club's expected starting eleven for the gameweek, match by match.");
    expect(filed?.body).toBe("All 2 of the gameweek's matches, with both sides named.");
  });

  // Craig, 9 Oct: "Showing Isak as starting when he's out". Scout's eleven is printed as given, and marked.
  it("marks a man the football says is out, and a doubt, never replacing either", () => {
    const filed = column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }));
    const men = (filed?.lineups as { home: { men: { name: string; status?: string }[] } }[])[0].home.men;
    expect(men).toHaveLength(11);
    expect(men[0]).toMatchObject({ name: "First Man100", status: "OUT" });
    expect(men[1]).toMatchObject({ name: "First Man101", status: "Doubt" });
    expect(men[2].status).toBeUndefined();
  });

  it("says how many of the gameweek's matches it printed when one is missing", () => {
    expect(column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3) }))?.body).toBe("1 of the gameweek's 2 matches, with both sides named.");
  });
});
