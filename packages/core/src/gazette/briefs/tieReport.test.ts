import { describe, expect, it } from "vitest";
import { buildTieReportBrief } from "./tieReport";

const side = (name: string, points: number | null, scorers: { name: string; position: string | null; points: number }[] = []) => ({
  name,
  points,
  scorers,
});

describe("buildTieReportBrief", () => {
  it("states both totals and the margin between them", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 48),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("Cobblers 48, Wanderers 40");
    expect(brief).toContain("Margin 8");
  });

  it("calls a dead heat level rather than a margin of nought", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 40),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("Level.");
    expect(brief).not.toContain("Margin 0");
  });

  it("withholds the margin when either side is unpriced", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 48),
      away: side("Wanderers", null),
      threads: [],
    });

    expect(brief).toContain("Wanderers —");
    expect(brief).not.toContain("Margin");
  });

  it("names each man with the slot he was filed in", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 48, [
        { name: "B.Fernandes", position: "M", points: 22 },
        { name: "Haaland", position: "F", points: 14 },
      ]),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("B.Fernandes (M) 22");
    expect(brief).toContain("Haaland (F) 14");
  });

  it("omits the bracket for a man with no slot rather than printing an empty one", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 48, [{ name: "Saka", position: null, points: 8 }]),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("Saka 8");
    expect(brief).not.toContain("()");
  });

  it("names at most six men a side, so the writer chooses rather than reads out a roster", () => {
    const many = Array.from({ length: 11 }, (_, at) => ({
      name: `Man${at}`,
      position: "M",
      points: 20 - at,
    }));
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 100, many),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("Man5 (M) 15");
    expect(brief).not.toContain("Man6");
  });

  it("says a side is unpriced rather than reporting it as blank", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", null),
      away: side("Wanderers", 40, [{ name: "Palmer", position: "M", points: 12 }]),
      threads: [],
    });

    expect(brief).toContain("no man of his has been priced yet");
  });

  it("forbids the survey the round-report was written to produce", () => {
    const brief = buildTieReportBrief({
      gameweek: 4,
      home: side("Cobblers", 48),
      away: side("Wanderers", 40),
      threads: [],
    });

    expect(brief).toContain("Two managers, and no others");
  });
});
