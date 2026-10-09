import { describe, expect, it } from "vitest";
import { seasonCalls } from "./calls";
import { PLAYED, SQUADS } from "./__fixtures__/season";

describe("seasonCalls", () => {
  const calls = seasonCalls(PLAYED, SQUADS, []);

  it("ranks the squads in the order the season played out, and says how many are clear at the top", () => {
    expect(calls?.sides.map((side) => [side.place, side.teamId])).toEqual([[1, "a"], [2, "u"], [3, "c"], [4, "r"]]);
    expect(calls?.clear).toBe(1);
  });

  it("builds each side round the first man it drafted, and names its best man only when he is someone else", () => {
    const albion = calls?.sides[0];
    expect(albion?.first?.name).toBe("Erling Haaland");
    expect(albion?.best?.name).toBe("Bukayo Saka");
    expect(calls?.sides[1].best).toBeNull();
  });

  it("gives a side's weak spot as its man in doubt before its weakest slot, ranked against the others", () => {
    expect(calls?.sides[0].weakness).toEqual({ kind: "line", slot: "G", rank: 4 });
    expect(calls?.sides[0].strongest).toEqual({ slot: "D", rank: 1 });
    expect(calls?.sides[1].weakness).toEqual({ kind: "doubt", man: SQUADS.get("u")?.[0] });
  });

  it("alternates what the lines open on down the rankings", () => {
    expect(calls?.sides.map((side) => side.lead)).toEqual(["man", "weakness", "man", "weakness"]);
  });

  it("finds nobody clear when the top three are bunched", () => {
    const bunched = { ...PLAYED, table: PLAYED.table.map((row, at) => ({ ...row, meanPlace: 2 + at * 0.2 })) };
    expect(seasonCalls(bunched, SQUADS, [])?.clear).toBe(0);
  });

  it("prints the editor's order over the code's, and builds every side's facts and lead on its printed place", () => {
    const moved = seasonCalls(PLAYED, SQUADS, [{ teamId: "r", place: 3, by: "Craig", on: "2026-10-05", said: "put Rovers 3rd" }]);
    expect(moved?.sides.map((side) => [side.place, side.teamId, side.lead])).toEqual([[1, "a", "man"], [2, "u", "weakness"], [3, "r", "man"], [4, "c", "weakness"]]);
    expect(moved?.moved).toEqual([{ teamId: "r", place: 3, by: "Craig", on: "2026-10-05", said: "put Rovers 3rd", from: 4 }]);
    expect(calls?.moved).toEqual([]);
  });

  it("finds a squad clear only on the code's places, and only while the editor leaves it there", () => {
    const table = [["a", 1.0], ["u", 1.5], ["c", 3.0], ["r", 3.2]].map(([teamId, meanPlace]) => ({ teamId: String(teamId), name: String(teamId), meanPlace: Number(meanPlace), placed: [] }));
    const played = { ...PLAYED, table };
    expect(seasonCalls(played, SQUADS, [])?.clear).toBe(2);
    // Rovers moved second are not clear of anybody, and Albion alone never were.
    expect(seasonCalls(played, SQUADS, [{ teamId: "r", place: 2, by: "Craig", on: "2026-10-05", said: "" }])?.clear).toBe(0);
    expect(seasonCalls(played, SQUADS, [{ teamId: "u", place: 1, by: "Craig", on: "2026-10-05", said: "" }])?.clear).toBe(2);
  });

  it("ranks nothing for a league too small to rank", () => {
    expect(seasonCalls({ ...PLAYED, table: PLAYED.table.slice(0, 2) }, SQUADS, [])).toBeNull();
  });
});
