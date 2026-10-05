import { describe, expect, it } from "vitest";
import { playoffCut, seasonCalls } from "./calls";
import { CUT, INJURED, PLAYED, SQUADS, man } from "./__fixtures__/season";

describe("seasonCalls", () => {
  const calls = seasonCalls(PLAYED, SQUADS, CUT);

  it("takes the table, the title, the playoff places and the spoon from the season as played", () => {
    expect(calls?.sides.map((side) => [side.place, side.teamId])).toEqual([[1, "a"], [2, "u"], [3, "c"], [4, "r"]]);
    expect(calls?.title).toEqual({ teamId: "a", runnerUp: "u", close: false });
    expect(calls?.through).toEqual(["a"]);
    expect(calls?.playIn).toEqual(["u"]);
    expect(calls?.out).toEqual({ teamId: "c", close: false });
    expect(calls?.spoon).toEqual({ teamId: "r", ninth: "c", close: false });
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

  it("alternates what the lines open on down the table", () => {
    expect(calls?.sides.map((side) => side.lead)).toEqual(["man", "weakness", "man", "weakness"]);
  });

  it("calls the side holding the first man of the draft out of the playoffs when the table has them out", () => {
    const flipped = new Map(SQUADS);
    flipped.set("c", [man("c1", "Bruno Fernandes", "Manchester United", 180, 1), man("c2", "Jarrod Bowen", "West Ham United", 175, 8)]);
    flipped.set("u", [man("u1", "Mohamed Salah", "Liverpool", 190, 3, INJURED), man("u2", "Cole Palmer", "Chelsea", 170, 6)]);
    expect(seasonCalls(PLAYED, flipped, CUT)?.bold).toMatchObject({ kind: "first-misses", teamId: "c", place: 3 });
  });

  it("otherwise calls the steal: the best man taken in the draft's second half, and how many of the first men taken he outscores", () => {
    expect(calls?.bold).toMatchObject({ kind: "steal", teamId: "a", outscores: 4, of: 4, among: "first" });
    expect(calls?.bold?.man.name).toBe("Bukayo Saka");
  });

  it("calls a close race close", () => {
    const tight = { ...PLAYED, table: PLAYED.table.map((row, at) => (at === 1 ? { ...row, placed: [50, 30, 15, 5] } : row)) };
    expect(seasonCalls(tight, SQUADS, CUT)?.title.close).toBe(true);
  });

  it("calls nothing for a table too short for a title, the playoffs and a spoon", () => {
    expect(seasonCalls({ ...PLAYED, table: PLAYED.table.slice(0, 2) }, SQUADS, CUT)).toBeNull();
  });
});

describe("playoffCut", () => {
  it("splits Fantrax's playoff places at the league's lines: 1st to 3rd straight in, 4th and 5th playing in", () => {
    const lines = [1, 3, 5, 8].map((under) => ({ under }));
    expect(playoffCut(4, lines)).toEqual({ through: 3, playIn: 2 });
  });

  it("sends every playoff place straight in where the league drew no lines, and nobody where it runs no playoff", () => {
    expect(playoffCut(4, [])).toEqual({ through: 4, playIn: 0 });
    expect(playoffCut(0, [])).toEqual({ through: 0, playIn: 0 });
  });
});
