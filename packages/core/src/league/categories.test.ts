import { describe, expect, it } from "vitest";
import { offeredIn } from "./categories";
import { rankBy } from "./categoryBoard";
import type { CategoryLine } from "./fantrax/seasonStats";

// The SEASON_STATS captions each league published on 1 Oct 2026, both halves read and combined by mapSeasonStats.
const REAL = ["Minutes Played", "Clean Sheets On Field", "Goals Against", "Yellow Cards", "Red Cards", "Penalty Kick Saves", "Penalty Kicks Missed", "Keeper Points", "Goals", "Assists (Total)", "Own Goals", "Penalties", "Defensive Points", "Defensive Points 3"];
const REHEARSAL = ["Minutes Played", "Clean Sheets On Field", "Goals Against", "Saves", "Yellow Cards", "Red Cards", "Penalty Kick Saves", "Penalty Kicks Missed", "Goals", "Assists (Official)", "Assists (Fantasy)", "Own Goals", "Defensive Points", "Defensive Points 2", "Defensive Points 3", "Defensive Contributions 3", "Defensive Contributions 2", "Midfielder Points", "Defensive Contributions"];
const board = (captions: readonly string[]) =>
  new Map<string, CategoryLine[]>(captions.map((caption) => [caption, [{ teamId: "t1", points: 6, value: 2 }, { teamId: "t2", points: 3, value: 1 }]]));

describe("offeredIn", () => {
  it("offers the real league's assists and keeper points, and not the categories it no longer scores", () => {
    expect(offeredIn("attacking", board(REAL)).map((c) => c.key)).toEqual(["Goals", "Assists (Total)", "Penalty Kicks Missed"]);
    expect(offeredIn("keeping", board(REAL)).map((c) => c.key)).toEqual(["Keeper Points", "Penalty Kick Saves"]);
  });

  it("offers the real league's DefCon, both counts, beside its clean sheets", () => {
    expect(offeredIn("defensive", board(REAL)).map((c) => c.key)).toEqual(["Clean Sheets On Field", "Defensive Points", "Defensive Points 3", "Goals Against"]);
  });

  it("offers the rehearsal league what it always has", () => {
    expect(offeredIn("attacking", board(REHEARSAL)).map((c) => c.key)).toEqual(["Goals", "Assists (Official)", "Assists (Fantasy)", "Penalty Kicks Missed"]);
    expect(offeredIn("defensive", board(REHEARSAL)).map((c) => c.key)).toEqual(["Clean Sheets On Field", "Defensive Points", "Defensive Points 3", "Goals Against"]);
    expect(offeredIn("keeping", board(REHEARSAL)).map((c) => c.key)).toEqual(["Saves", "Penalty Kick Saves"]);
  });

  it("names what it offers in plain words, never Fantrax's captions", () => {
    expect(offeredIn("attacking", board(REAL)).map((c) => c.label)).toEqual(["Goals", "Assists", "Penalties missed"]);
    expect(offeredIn("attacking", board(REHEARSAL)).map((c) => c.label)).toEqual(["Goals", "Assists", "Extra assists", "Penalties missed"]);
    expect(offeredIn("defensive", board(REAL)).map((c) => c.label)).toEqual(["Clean sheets", "DefCon", "DefCon+", "Goals conceded"]);
    expect(offeredIn("keeping", board(REAL)).map((c) => c.title ?? c.label)).toEqual([
      "Keeper actions: saves, smothers, punches and high claims won",
      "Penalties saved",
    ]);
  });

  it("heads DefCon DC and DC+, and still files it under Fantrax's captions", () => {
    const defensive = offeredIn("defensive", board(REAL));
    expect(defensive.map((c) => c.short)).toEqual(["CS", "DC", "DC+", "GA"]);
    expect(defensive.map((c) => c.key)).toContain("Defensive Points 3");
  });

  it("offers the whole group when Fantrax answered nothing, so the empty board still says what it is for", () => {
    expect(offeredIn("attacking", new Map()).map((c) => c.key)).toContain("Assists (Total)");
  });

  it("ranks the real league by its assists", () => {
    const columns = offeredIn("attacking", board(REAL));
    const assists = columns.find((c) => c.key === "Assists (Total)")!;
    expect(rankBy(columns, board(REAL), assists, "value").map((row) => row.figures)).toEqual([[2, 2, 2], [1, 1, 1]]);
  });
});
