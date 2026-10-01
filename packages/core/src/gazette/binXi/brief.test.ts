import { describe, expect, it } from "vitest";
import { binStandfirst, buildBinBrief, type BinBriefInput } from "./brief";
import type { BinMan } from "./select";

function man(name: string, clubId: number, position: string, points: number, more: Partial<BinMan> = {}): BinMan {
  return {
    fantraxId: name, code: clubId * 100 + points, name, clubId, position, points, minutes: 90, started: true, goals: 0, assists: 0,
    expectedGoals: 0.84, expectedAssists: 0.3, shots: 0, shotsOnTarget: 0, chancesCreated: 0, ...more,
  };
}

const daSilva = man("Jay da Silva", 1, "D", 12, { goals: 1, shots: 2, shotsOnTarget: 1 });
const jackson = man("Nicolas Jackson", 2, "F", 5, { goals: 1, shots: 6, shotsOnTarget: 2 });
const rashford = man("Marcus Rashford", 3, "F", 2, { minutes: 76, shots: 6, chancesCreated: 4 });

const input: BinBriefInput = {
  gameweek: 5,
  side: { shape: "4-4-2", xi: [daSilva, jackson], bench: [rashford], total: 83 },
  sides: [90, 70, 60, null, 84],
  club: (id) => ["", "Coventry City", "Aston Villa", "Manchester United"][id],
  matches: (id) => (id === 1 ? [{ opponent: "Newcastle United", home: true, scored: 2, conceded: 0 }] : id === 2 ? [{ opponent: "Everton", home: false, scored: 1, conceded: 1 }] : []),
  extras: (each) => ({ cleanSheet: each === daSilva, saves: null, tacklesWon: 0, interceptions: each === daSilva ? 2 : null, clearances: null }),
  history: (each) => (each === daSilva ? ["Dropped by Timbeibs in gameweek 3"] : []),
  undrafted: (each) => each !== daSilva,
  status: (each) => (each === jackson ? "injured" : null),
  lastWeek: new Set([jackson.code]),
  blanked: ["Fulham"],
  threads: [],
};

describe("buildBinBrief", () => {
  const brief = buildBinBrief(input);

  it("gives the desk's one comparison, over the sides Fantrax scored", () => {
    expect(brief).toContain("the eleven scored 83 points between them. 2 of the league's 4 sides scored fewer.");
  });

  it("groups the men by club, with the club's result from its own side", () => {
    expect(brief).toContain("Coventry City (beat Newcastle United 2-0 at home):");
    expect(brief).toContain("Aston Villa (drew with Everton 1-1 away):");
  });

  it("writes a man's week out, and prints nothing at nought", () => {
    expect(brief).toContain("- Jay da Silva, Coventry City, D: 12 points. 90 minutes. A goal and a clean sheet. 2 shots, 1 on target and 2 interceptions. Dropped by Timbeibs in gameweek 3.");
    expect(brief).not.toMatch(/(?<![-\d])0 \p{L}/u);
  });

  it("says who returns and who is now unfit, and which clubs had no match", () => {
    expect(brief).toContain("In last week's Bin XI too. Now injured.");
    expect(brief).toContain("NO MATCH THIS GAMEWEEK: Fulham.");
  });

  it("says once who went undrafted, never on every man", () => {
    expect(brief).toContain("UNDRAFTED: Nicolas Jackson and Marcus Rashford.");
    expect(buildBinBrief({ ...input, undrafted: () => true })).toContain("UNDRAFTED: every man above.");
    expect(buildBinBrief({ ...input, undrafted: () => false })).not.toContain("UNDRAFTED");
  });

  it("gives the bench its reason", () => {
    expect(brief).toContain("THE BENCH, picked for what they did without the goals or assists to show for it:");
    expect(brief).toContain("Marcus Rashford, Manchester United, F: 2 points. 76 minutes. 6 shots and 4 chances created.");
  });

  it("never carries the desk's workings: they are figures in the box, never words in the column", () => {
    expect(brief).not.toMatch(/xG|xA|expected/iu);
  });
});

describe("binStandfirst", () => {
  it("says what the piece is and sets the total against the league's sides, in the house's numerals", () => {
    expect(binStandfirst(5, 83, [90, 70, 60, null, 84])).toBe("The best eleven nobody in the league has scored 83 points in gameweek 5, more than two of the league's four sides.");
    expect(binStandfirst(5, 95, [90, 70])).toBe("The best eleven nobody in the league has scored 95 points in gameweek 5, more than any side in the league.");
    expect(binStandfirst(5, 50, [90, 70])).toBe("The best eleven nobody in the league has scored 50 points in gameweek 5, fewer than every side in the league.");
    expect(binStandfirst(5, 50, [null])).toBe("The best eleven nobody in the league has scored 50 points in gameweek 5.");
  });
});
