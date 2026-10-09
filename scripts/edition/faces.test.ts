import { describe, expect, it } from "vitest";
import type { Assignment, FootballSnapshot, PresserLine } from "@epl/core";
import { faceOf } from "./faces";

// GW6, Friday 9 Oct 2026: Iraola calls Jacquet (Truffles') fit again from his hamstring, and Scout starts him.
const LINEUPS: Assignment = { kind: "predicted-xi", key: "predicted-xi:gw6:ab12cd34", slug: "gw6-predicted-xi", round: { period: 6, gameweek: 6 } };
const said = "2026-10-09T12:30:00.000Z";
const line = (over: Partial<PresserLine> & Pick<PresserLine, "code" | "playerName">): PresserLine => ({
  club: 14, tag: "available", confidence: 0.65, said, manager: "Andoni Iraola", clubName: "Liverpool", ownerName: "Truffles", fresh: true, ...over,
});
const player = (code: number, clubId: number, influence: number) =>
  ({ code, clubId, season: { influence } }) as unknown as FootballSnapshot["players"][number];

const JACQUET = line({ code: 606702, playerName: "Jeremy Jacquet", condition: "hamstring" });
// An owned starter named for a knock, and a bigger name than Jacquet.
const SAKA = line({ code: 223340, playerName: "Bukayo Saka", club: 3, clubName: "Arsenal", tag: "injury_scare", manager: "Mikel Arteta", ownerName: "Glengarry" });
// Fit again and starting, but nobody in the league holds him.
const FREE = line({ code: 500040, playerName: "Free Agent", club: 3, clubName: "Arsenal", manager: "Mikel Arteta", ownerName: null });
// Owned and fit again, but on the bench.
const BENCHED = line({ code: 648000, playerName: "Benched Man", ownerName: "Truffles" });

const players = [player(606702, 12, 180), player(223340, 1, 900), player(500040, 1, 2000), player(648000, 12, 3000)];
const starters = new Set([606702, 223340, 500040]);

describe("the Line-Ups' picture", () => {
  it("is an owned starter back fit, over a bigger owned name, an unowned one and a benched one", () => {
    const face = faceOf(LINEUPS, { presserLines: [SAKA, FREE, BENCHED, JACQUET], players, starters });
    expect(face).toEqual({ code: 606702, name: "Jeremy Jacquet", clubId: 12, position: null });
  });

  it("is an owned starter the pressers named, when none is back fit", () => {
    const face = faceOf(LINEUPS, { presserLines: [FREE, BENCHED, SAKA], players, starters });
    expect(face?.name).toBe("Bukayo Saka");
  });

  it("is nobody when no owned starter was named", () => {
    expect(faceOf(LINEUPS, { presserLines: [FREE, BENCHED], players, starters })).toBeNull();
    expect(faceOf(LINEUPS, { presserLines: [JACQUET], players })).toBeNull();
  });
});
