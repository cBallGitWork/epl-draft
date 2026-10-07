import { describe, expect, it } from "vitest";
import { mapStatSheet } from "./statSheet";
import type { RawPoolStats } from "./stats";

// Trimmed from the stats league's `getPlayerStats`: two fixed columns, the two `CS` that share a short name,
// and OUTP, the league's own points.
const RAW: RawPoolStats = {
  tableHeader: {
    cells: [
      { key: "rankOv", shortName: "Rk" },
      { key: "fpts", shortName: "FPts" },
      { key: "5010#6120#-1", scipId: "5010#6120#-1", shortName: "Min", name: "Minutes Played" },
      { key: "5010#6250#-1", scipId: "5010#6250#-1", shortName: "CS", name: "Clean Sheets" },
      { key: "5010#6249#-1", scipId: "5010#6249#-1", shortName: "CS", name: "Clean Sheets On Field" },
      { key: "5010#600n#-1", scipId: "5010#600n#-1", shortName: "OUTP", name: "Outfielder points" },
    ],
  },
  statsTable: [
    { scorer: { scorerId: "04fk1" }, cells: [{ content: "1" }, { content: "38" }, { content: "450" }, { content: "3" }, { content: "2" }, { content: "10.5" }] },
    { cells: [{ content: "" }] },
    { scorer: { scorerId: "068y0" }, cells: [{ content: "2" }, { content: "30" }, { content: "1,210" }, { content: "-" }] },
  ],
  displayedSeasonOrProjection: { code: "SEASON_926_YEAR_TO_DATE", name: "2026-27 - YTD", timeframeTypeCode: "YEAR_TO_DATE" },
};

describe("mapStatSheet", () => {
  it("reads every scoring category by its stat id, and no fixed column", () => {
    const sheet = mapStatSheet(RAW);
    expect(sheet.columns.map((column) => column.stat)).toEqual(["6120", "6250", "6249", "600n"]);
    expect(sheet.columns.map((column) => column.short)).toEqual(["Min", "CS", "CS", "OUTP"]);
  });

  it("keeps two columns that share a short name apart", () => {
    const [grosz] = mapStatSheet(RAW).lines;
    expect(grosz).toEqual({ fantraxId: "04fk1", values: [450, 3, 2, 10.5] });
  });

  it("reads a dash and a missing cell as nothing, and skips a row with no player", () => {
    const lines = mapStatSheet(RAW).lines;
    expect(lines.map((line) => line.fantraxId)).toEqual(["04fk1", "068y0"]);
    expect(lines[1].values).toEqual([1210, null, null, null]);
  });

  it("says whether the numbers were played or projected", () => {
    expect(mapStatSheet(RAW).season.projected).toBe(false);
    expect(mapStatSheet({ ...RAW, displayedSeasonOrProjection: { timeframeTypeCode: "PROJECTED_SEASON" } }).season.projected).toBe(true);
  });
});
