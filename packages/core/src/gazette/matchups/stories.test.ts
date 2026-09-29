import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { sideStories } from "./stories";
import type { DraftMan, DraftSide } from "./types";

const side = (eleven: DraftMan[]): DraftSide => ({ teamId: "t", name: "Dons", total: 40, eleven, bench: [], subOrder: [] });

describe("sideStories", () => {
  it("says two men from one club both blanked", () => {
    const lines = sideStories(side([draftMan("Saliba", "D", 2, 90, 0, { club: "ARS" }), draftMan("Calafiori", "D", 1, 90, 0, { club: "ARS" })]));
    expect(lines).toEqual(["2 ARS men, Saliba and Calafiori, both blanked"]);
  });

  it("names a haul, a goal in added time and a clean sheet lost late", () => {
    const lines = sideStories(
      side([
        draftMan("Isak", "F", 11, 90, 0, { goals: 1, assists: 1, scoredAt: [{ minute: 90, added: 4 }] }),
        draftMan("Tarkowski", "D", 2, 90, 0, { club: "EVE", concededFirstAt: [{ minute: 88 }] }),
      ]),
    );
    expect(lines).toEqual(["Isak (Club) hauled: a goal and an assist, 11 points", "Isak (Club) scored in added time (90+4)", "Tarkowski (EVE, D) lost his clean sheet to a goal in the 88th minute"]);
  });

  it("counts neither first-half added time as late, nor a clean sheet lost by a man on for less than an hour", () => {
    const lines = sideStories(
      side([
        draftMan("Gray", "M", 2, 90, 0, { club: "TOT", concededFirstAt: [{ minute: 45, added: 4 }] }),
        draftMan("Hemmings", "M", 1, 18, 0, { club: "AVL", concededFirstAt: [{ minute: 86 }] }),
      ]),
    );
    expect(lines).toEqual([]);
  });

  it("splits a club's men who did not share a fate, and leaves an early goal conceded alone", () => {
    const lines = sideStories(
      side([draftMan("Pickford", "G", 6, 90, 0, { club: "EVE", cleanSheets: 1 }), draftMan("Keane", "D", 1, 90, 0, { club: "EVE", concededFirstAt: [{ minute: 12 }] })]),
    );
    expect(lines).toEqual(["of the EVE men, Pickford returned and Keane blanked"]);
  });
});
