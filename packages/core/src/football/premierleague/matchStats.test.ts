import { describe, expect, it } from "vitest";
import recordedStats from "../__fixtures__/plMatchStats.json";
import { plMatchBoard } from "./matchStats";
import type { RawPlMatchStats } from "./rawStats";

// Liverpool 2-2 Nottingham Forest (GW2), by their own team ids: Liverpool 10, Forest 15.
const STATS = recordedStats as unknown as RawPlMatchStats;
const LIVERPOOL = 10;
const FOREST = 15;

const board = plMatchBoard(STATS, LIVERPOOL, FOREST);
const row = (key: string) => board?.find((r) => r.key === key);

describe("plMatchBoard", () => {
  it("draws Championship Manager's thirteen rows in its order, and the five simple ones among them", () => {
    // `cm9900/22.jpg`. The order is the reference's and a caller may not sort it.
    expect(board?.map((r) => r.label)).toEqual([
      "Possession",
      "Shots On Goal",
      "On Target",
      "Off Target",
      "Blocked",
      "Corners",
      "Free Kicks",
      "Throw-Ins",
      "Fouls",
      "Offsides",
      "Passes Completed",
      "Tackles Won",
      "Headers Won",
      "Interceptions",
      "Clearances",
      "Saves",
      "Yellow Cards",
      "Red Cards",
    ]);
  });

  it("reads a plain count off both sides", () => {
    expect(row("shots")).toMatchObject({ home: 13, away: 12, percent: false });
    expect(row("onTarget")).toMatchObject({ home: 4, away: 3 });
  });

  it("splits the shots three ways, so the rows under Shots add up to it", () => {
    // 13 = 4 + 5 + 4 and 12 = 3 + 3 + 6.
    expect(row("blocked")).toMatchObject({ home: 4, away: 6 });
    for (const side of ["home", "away"] as const) {
      const parts = ["onTarget", "offTarget", "blocked"].map((key) => row(key)?.[side] ?? 0);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(row("shots")?.[side]);
    }
  });

  it("rounds Opta's possession to a whole share that still sums to a hundred", () => {
    // 69.1 and 30.9.
    expect(row("possession")).toMatchObject({ home: 69, away: 31, percent: true });
  });

  it("does not confuse fouls won with fouls conceded", () => {
    // `fk_foul_won` is fouls WON and `fk_foul_lost` fouls COMMITTED. Liverpool
    // won 10 and conceded 13; Forest the mirror. Wire these backwards and every
    // board in the app is quietly wrong in a way no type can catch.
    expect(row("freeKicks")).toMatchObject({ home: 10, away: 13 });
    expect(row("fouls")).toMatchObject({ home: 13, away: 10 });
  });

  it("turns a pair of metrics into a whole percentage", () => {
    // 562/631 and 193/288.
    expect(row("passes")).toMatchObject({ home: 89, away: 67, percent: true });
    // 9/21 and 13/23.
    expect(row("tackles")).toMatchObject({ home: 43, away: 57, percent: true });
  });

  it("builds the headers denominator from won plus lost", () => {
    // Opta publishes no aerial total, so the denominator is the sum: 12/(12+17)
    // and 17/(17+12). The two sides of one duel, so the pair sums to 100.
    expect(row("headers")).toMatchObject({ home: 41, away: 59, percent: true });
  });

  it("reads a metric the payload OMITS as nought, not as an absence", () => {
    // The inversion of DESIGN §7. Forest committed no offside and neither side
    // was sent off, and the provider says so by saying nothing. A dash here
    // would claim we do not know.
    expect(row("offsides")).toMatchObject({ home: 3, away: 0 });
    expect(row("redCards")).toMatchObject({ home: 0, away: 0 });
  });

  it("marks the four percentage rows and only those", () => {
    // CM's own board prints its percentages in cyan; possession is Opta's share.
    expect(board?.filter((r) => r.percent).map((r) => r.key)).toEqual([
      "possession",
      "passes",
      "tackles",
      "headers",
    ]);
  });

  it("answers null for a side the payload has no stats for", () => {
    // An absence, and a caller may not draw it as thirteen noughts. A board is a
    // comparison, so one side missing is as unusable as both.
    expect(plMatchBoard(STATS, LIVERPOOL, 999)).toBeNull();
    expect(plMatchBoard({ data: {} }, LIVERPOOL, FOREST)).toBeNull();
  });
});
