import { describe, expect, it } from "vitest";
import { mapLeagueInfo, type LeagueScoring } from "@epl/core";
import real from "../../../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../../../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import { fantasyBoxes, type FantasyMan } from "./fantasyCategories";

// Both leagues' getLeagueInfo of 1 Oct 2026: the real one scores AT, GKP, DFP and DFP3, the rehearsal A, AF and Sv.
function scoringOf(info: ReturnType<typeof mapLeagueInfo>): LeagueScoring | null {
  return info.scoring === null ? null : { rules: info.scoring, categories: info.scoringCategories };
}
const scoring = scoringOf(mapLeagueInfo(real));

let next = 1;
function man(named: string, position: string, counts: Record<string, number>, fplDefCon?: number): FantasyMan {
  const code = next++;
  return { code, name: `${position}${code}`, named, league: { position, counts }, fplDefCon };
}

const boxOf = (men: FantasyMan[], key: string, by: LeagueScoring | null = scoring) =>
  fantasyBoxes({ home: men, away: [] }, by).find((box) => box.key === key);

describe("fantasyBoxes on the real league", () => {
  it("counts assists under AT and a keeper's work under GKP, never the rehearsal's A and Sv", () => {
    const keeper = man("G", "G", { GKP: 4, AT: 1 });
    const boxes = fantasyBoxes({ home: [keeper], away: [] }, scoring);
    expect(boxes.map((box) => [box.key, box.label])).toEqual([
      ["INDIVIDUAL_ASSISTS_TOTAL", "Assists"],
      ["INDIVIDUAL_KEEPER_POINTS", "Keeper actions"],
    ]);
  });

  it("heads every box in plain football words, never Fantrax's caption", () => {
    const everything = { G: 1, AT: 1, A: 1, GKP: 1, Sv: 1, PKS: 1, PKM: 1, OG: 1, YC: 1, RC: 1 };
    const heads = (league: LeagueScoring | null) =>
      fantasyBoxes({ home: [man("G", "G", everything)], away: [] }, league).map((box) => box.label);
    const plain = ["Goals", "Assists", "Keeper actions", "Penalties saved", "Penalties missed", "Own goals", "Yellow cards", "Red cards"];
    expect(heads(scoring)).toEqual(plain);
    expect(heads(scoringOf(mapLeagueInfo(rehearsal)))).toEqual(plain.map((head) => (head === "Keeper actions" ? "Saves" : head)));
  });

  it("lists our DefCon from 1 for a defender, 4 for a midfielder and 3 for a forward, and nobody below", () => {
    const listed = [
      man("D", "D", { DFP: 1, DFP3: 9 }),
      man("M", "M", { DFP: 0, DFP3: 4 }),
      man("F", "F", { DFP: 0, DFP3: 3 }),
    ];
    const below = [man("D", "D", { DFP: 0, DFP3: 9 }), man("M", "M", { DFP3: 3 }), man("F", "F", { DFP3: 2 })];
    const box = boxOf([...listed, ...below], "defcon");
    expect(box?.home.map((m) => m.code).sort()).toEqual(listed.map((m) => m.code).sort());
    expect(box?.home.some((m) => m.count === 0)).toBe(false);
  });

  it("reads our DefCon at the letter his points are priced at, not where the team sheet named him", () => {
    // Named at the back, priced as a midfielder: his 5 DFP is nothing to the league, his 4 DFP3 is close.
    const wingBack = man("D", "M", { DFP: 5, DFP3: 4 });
    expect(boxOf([wingBack], "defcon")?.home).toEqual([{ code: wingBack.code, name: wingBack.name, count: 4 }]);
  });

  it("puts the man nearest his mark first, across positions", () => {
    const mid = man("M", "M", { DFP3: 7 });
    const back = man("D", "D", { DFP: 3 });
    expect(boxOf([mid, back], "defcon")?.home.map((m) => m.code)).toEqual([back.code, mid.code]);
  });

  it("keeps FPL's DefCon in a box of its own, from half FPL's threshold by where he was named", () => {
    const men = [man("D", "M", {}, 5), man("M", "M", {}, 6), man("F", "F", {}, 5), man("G", "G", {}, 12)];
    const box = boxOf(men, "fpl-defcon");
    expect(box?.label).toBe("FPL DefCon");
    expect(box?.home.map((m) => m.count)).toEqual([6, 5]);
  });
});

describe("fantasyBoxes without the league", () => {
  it("shows only FPL's DefCon when the league did not answer", () => {
    const boxes = fantasyBoxes({ home: [man("D", "D", { DFP: 4, G: 1 }, 10)], away: [] }, null);
    expect(boxes.map((box) => box.key)).toEqual(["fpl-defcon"]);
  });
});
