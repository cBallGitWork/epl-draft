import { describe, expect, it } from "vitest";
import { STAT_COLUMNS } from "../football/intel/statKeys";
import { DEFENSIVE_POINTS, DEFENSIVE_POINTS_3 } from "../league/categoryNames";
import { wordsFor } from "../league/categoryWords";

// The football layer may not import the league's words, so its DefCon labels are spelled twice; this keeps them one.
describe("the stats league's DefCon counts", () => {
  it("are headed as the league heads its DefCon categories", () => {
    const label = (key: string) => STAT_COLUMNS.find((column) => column.key === key)?.label;
    expect([label("defensivePoints"), label("defensivePoints3")]).toEqual([wordsFor(DEFENSIVE_POINTS).head, wordsFor(DEFENSIVE_POINTS_3).head]);
  });
});
