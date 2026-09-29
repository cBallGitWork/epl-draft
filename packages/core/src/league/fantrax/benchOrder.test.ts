import { describe, expect, it } from "vitest";
import { mapBenchOrder, type RawTeamRosterInfo } from "./benchOrder";

// The shape of the rehearsal league's roster page, 29 Sep 2026: a keeper table then an outfield table, empty slots scorerless.
const raw = (order: Record<string, number> = {}): RawTeamRosterInfo => ({
  miscData: { autoSubsOrderingType: "USER", autoSubOrderMap: order },
  tables: [
    { rows: [{ statusId: "1", scorer: { scorerId: "gk1", posShortNames: "G" } }, { statusId: "2", scorer: { scorerId: "gk2", posShortNames: "G" } }, { statusId: "2" }] },
    { rows: [{ statusId: "1", scorer: { scorerId: "d1", posShortNames: "D" } }, { statusId: "2", scorer: { scorerId: "d2", posShortNames: "D" } }, { statusId: "2", scorer: { scorerId: "m2", posShortNames: "M" } }] },
  ],
});

describe("mapBenchOrder", () => {
  it("reads the page's listing of reserves when the manager has not numbered his bench", () => {
    expect(mapBenchOrder(raw())).toEqual({ order: ["gk2", "d2", "m2"], numbered: false });
  });

  it("follows the manager's numbers, with any reserve he left unnumbered after them", () => {
    expect(mapBenchOrder(raw({ m2: 1, d2: 2 }))).toEqual({ order: ["m2", "d2", "gk2"], numbered: true });
  });
});
