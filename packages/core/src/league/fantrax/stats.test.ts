import { describe, expect, it } from "vitest";
import { mapPoolStats, mapTeamStats, numeric, season } from "./stats";
import teamStats from "./__fixtures__/teamStats.json";
import poolStats from "./__fixtures__/poolStats.json";

describe("numeric", () => {
  it("reads the shapes Fantrax actually prints", () => {
    expect(numeric("109")).toBe(109);
    expect(numeric("3.41")).toBe(3.41);
    expect(numeric("-11")).toBe(-11);
    // Minutes cross a thousand and arrive with a separator.
    expect(numeric("2,835")).toBe(2835);
    expect(numeric("100%")).toBe(100);
  });

  it("keeps every printing of nothing as nothing", () => {
    // Three different blanks, none of them nought: an empty roster slot, the
    // dash for a category a player never registered, and the fixture column.
    expect(numeric("")).toBeNull();
    expect(numeric("-")).toBeNull();
    expect(numeric(undefined)).toBeNull();
    expect(numeric("@BHA<br/>Sun 9:00AM")).toBeNull();
  });
});

describe("season", () => {
  it("believes Fantrax about which numbers these are", () => {
    expect(season({ code: "SEASON_926_YEAR_TO_DATE", timeframeTypeCode: "YEAR_TO_DATE" }).projected).toBe(
      false,
    );
    expect(season({ code: "PROJECTION_0_926_SEASON", timeframeTypeCode: "PROJECTED_SEASON" }).projected).toBe(
      true,
    );
  });

  it("calls it a projection when Fantrax says nothing", () => {
    // Failing toward the label that admits a doubt. Printing a projection under
    // a season heading is the one mistake this field exists to prevent.
    expect(season(undefined).projected).toBe(true);
    expect(season({ code: "SEASON_926_YEAR_TO_DATE" }).projected).toBe(true);
  });
});

describe("mapTeamStats", () => {
  const stats = mapTeamStats(teamStats);

  it("keeps the two scoring groups apart", () => {
    // A keeper's saves and an outfielder's goals-against are different columns
    // in different tables. Flattening would file one under the other.
    expect(stats.groups.map((group) => group.name)).toEqual(["Goalkeeper", "Outfielder"]);
    expect(stats.groups[0].columns.map((column) => column.code)).toEqual([
      "GP", "Min", "CS", "GA", "Sv", "YC", "RC", "PKS", "PKM", "G", "A", "AF", "OG",
    ]);
    expect(stats.groups[1].columns.map((column) => column.code)).toEqual([
      "GP", "Min", "G", "A", "AF", "YC", "RC", "PKM", "OG", "GAO", "CS",
    ]);
  });

  it("reads the categories as points, and they sum to the total", () => {
    // The whole reason to read this endpoint: Fantrax explains its own number.
    // Games played is a category on the same row and is a count, not points, so
    // it is excluded from the sum exactly as their table excludes it.
    const [keeper] = stats.groups[0].lines;
    expect(keeper.points).toBe(109);
    const columns = stats.groups[0].columns;
    const sum = keeper.values.reduce<number>(
      (total, value, index) => (columns[index].code === "GP" ? total : total + (value ?? 0)),
      0,
    );
    expect(sum).toBe(keeper.points);
  });

  it("lines every value up with its column", () => {
    for (const group of stats.groups) {
      for (const line of group.lines) expect(line.values).toHaveLength(group.columns.length);
    }
  });

  it("drops the empty roster slots and keeps the players", () => {
    // An empty slot is a real row of real blank cells with no player in it. The
    // keeper table here is one keeper and one vacant reserve spot.
    expect(stats.groups[0].lines).toHaveLength(1);
    expect(stats.groups[1].lines).toHaveLength(2);
    expect(stats.groups[0].lines[0].name).toBe("Emiliano Martinez");
    expect(stats.groups[0].lines[0].clubCode).toBe("AVL");
  });

  it("carries the season Fantrax answered with, not the one we asked for", () => {
    expect(stats.season.code).toBe("SEASON_925_YEAR_TO_DATE");
    expect(stats.season.projected).toBe(false);
    expect(stats.teamId).toBe("8enbgqo5msgb375j");
  });

  it("survives a payload stripped of everything", () => {
    expect(mapTeamStats({}).groups).toEqual([]);
    expect(mapTeamStats({ tables: [{}] }).groups[0].lines).toEqual([]);
  });
});

describe("mapPoolStats", () => {
  const pool = mapPoolStats(poolStats);

  it("reads rank and points past the columns it does not model", () => {
    // Status and opponent sit between them and are not numbers at all.
    expect(pool.rows[0]).toEqual({ fantraxId: "061vq", rank: 1, points: 196, perGame: 5.6 });
  });

  it("says these are projected numbers, because they are", () => {
    // This endpoint refuses a year-to-date code and answers with a projection
    // anyway, so the label has to come from the answer.
    expect(pool.season.projected).toBe(true);
  });

  it("finds the current season's code by date, not by list order", () => {
    expect(pool.yearToDate).toBe("SEASON_926_YEAR_TO_DATE");
  });

  it("reports how many players Fantrax has, so a short read can say so", () => {
    expect(pool.total).toBe(708);
    expect(mapPoolStats({}).total).toBeNull();
  });

  it("asks for no code rather than composing one when none is offered", () => {
    expect(mapPoolStats({}).yearToDate).toBeNull();
    expect(
      mapPoolStats({ displayedLists: { displayedSeasonOrProjections: [{ code: "X" }] } }).yearToDate,
    ).toBeNull();
  });
});
