import { describe, expect, it } from "vitest";
import { mapAssistKinds } from "./assistKinds";
import type { PlayerStatLine } from "./playerStats";

const line = (fantraxId: string, stats: Record<string, number | null>): PlayerStatLine => ({
  fantraxId,
  name: fantraxId,
  club: null,
  clubShort: null,
  position: null,
  ownerTeamId: null,
  defaultPosition: null,
  points: null,
  stats,
});

describe("mapAssistKinds", () => {
  it("reads each kind off its own column, a handball won counting as a free kick", () => {
    expect(mapAssistKinds([line("cunha", { APKG: 1, AOG: 0, AFKG: 1, AHW: 1, FKG: 2, AR: 3 })])).toEqual([
      { fantraxId: "cunha", kinds: { penaltyWon: 1, ownGoalForced: 0, freeKickWon: 2, freeKickGoals: 2 } },
    ]);
  });

  it("keeps only the men with something to say", () => {
    expect(mapAssistKinds([line("quiet", { APKG: 0, AR: 1 }), line("absent", { APKG: null })])).toEqual([]);
  });

  it("says nothing for a league whose scoring lists none of the kinds", () => {
    // The real league lists A and AF only; the kinds are the stats league's alone.
    expect(mapAssistKinds([line("real", { A: 2, AF: 1 })])).toEqual([]);
  });
});
