import { describe, expect, it } from "vitest";
import type { RosteredTeam } from "../../join/roster";
import type { LeagueTransaction } from "../../league/types";
import { binHistory, undrafted, type BinHistoryInput } from "./history";
import type { BinMan } from "./select";

const man = { fantraxId: "a" } as BinMan;
const names: Record<string, string> = { t1: "Timbeibs", t2: "Notemail" };

function drop(fromTeamId: string | null, period: number | null, executed = true): LeagueTransaction {
  return {
    setId: "s", kind: "drop", fantraxId: "a", playerName: "A", position: "D", club: null, clubName: null, via: null,
    fromTeamId, toTeamId: null, processedAt: null, period, executed,
  };
}

const squad = (status: string) => [{ teamId: "t1", teamName: "Timbeibs", players: [{ slot: { fantraxId: "a", status } }] }] as unknown as RosteredTeam[];

const base: BinHistoryInput = {
  gameweek: 5, teams: [], fielded: true, transactions: [], pedigree: new Map(), teamName: (id) => names[id] ?? id, gameweekOf: (period) => period,
};

describe("binHistory", () => {
  it("says who had him this gameweek, and names or benches him only from the side that was fielded", () => {
    expect(binHistory({ ...base, teams: squad("ACTIVE") })(man)).toEqual(["Timbeibs named him in their side for gameweek 5"]);
    expect(binHistory({ ...base, teams: squad("RESERVE") })(man)).toEqual(["Timbeibs had him on the bench for gameweek 5"]);
    expect(binHistory({ ...base, teams: squad("ACTIVE"), fielded: false })(man)).toEqual(["Timbeibs had him for gameweek 5"]);
  });

  it("gives the latest drop, and the gameweek it took effect ahead of", () => {
    const facts = binHistory({ ...base, transactions: [drop("t1", 2), drop("t2", 4), drop("t1", 5, false)] })(man);
    expect(facts).toEqual(["Dropped by Notemail ahead of gameweek 4"]);
  });

  it("says who drafted him, and never his round", () => {
    const pick = { fantraxId: "a", teamId: "t2", round: 9, overall: 88 };
    expect(binHistory({ ...base, pedigree: new Map([["a", pick]]) })(man)).toEqual(["Drafted by Notemail"]);
  });

  it("knows nobody drafted him only once a draft has completed", () => {
    expect(undrafted(new Map([["b", {}]]))(man)).toBe(true);
    expect(undrafted(new Map([["a", {}]]))(man)).toBe(false);
    expect(undrafted(new Map())(man)).toBe(false);
  });
});
