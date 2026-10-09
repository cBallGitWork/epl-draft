import { describe, expect, it } from "vitest";
import { DASH, type StatsRow } from "@epl/core";
import type { PoolRow } from "./pool";
import { COLUMNS, columnFor } from "./columns";
import { columnsIn, sortableIn } from "./groups";
import { figureOf } from "./figure";
import { shownRows } from "./query";
import { SEASON_COLUMNS, seasonLine, seasonStats } from "./seasonColumns";

// Haaland's line in the stats league on 6 Oct 2026, and a keeper's, whose half of the read carries no shots or crosses.
const HAALAND: StatsRow = {
  minutes: 450,
  shots: 20,
  shotsOnTarget: 10,
  keyPasses: 1,
  bigChancesCreated: 1,
  bigChancesMissed: 4,
  crosses: 0,
  accurateCrosses: 0,
};
const KEEPER: StatsRow = { minutes: 450, shots: null, keyPasses: 0, crosses: null, saves: 16 };

// The real league's getPlayerStats columns on 1 Oct 2026: none of the seven.
const REAL = new Set(["GP", "Min", "G", "AT", "YC", "RC", "Pen", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP"]);
const KEYS = ["sh", "sot", "kp", "bcc", "bcm", "cr", "ac"];

const row = (fantraxId: string): PoolRow =>
  ({
    entry: {
      player: { fantraxId, displayName: fantraxId, rawName: fantraxId, clubCode: "MCI", position: null, rotowireId: null },
      eligiblePositions: ["F"],
      status: "T",
      ownerTeamId: null,
    },
    stats: null,
    fplCode: null,
  }) as unknown as PoolRow;

describe("the stats league's season columns", () => {
  it("heads the seven in the house's words, with KP titled chances created", () => {
    expect(SEASON_COLUMNS.map((column) => column.label)).toEqual(["Sh", "SoT", "KP", "BCC", "BCM", "Crs", "AC"]);
    expect(columnFor("kp")?.title).toBe("Chances created");
  });

  it("keys each apart from every other column, the attribute grid's Crossing included", () => {
    expect(SEASON_COLUMNS.map((column) => column.key)).toEqual(KEYS);
    expect(COLUMNS.filter((column) => KEYS.includes(column.key))).toEqual(SEASON_COLUMNS);
  });

  it("follows the fantasy attacking counts on the board", () => {
    const labels = COLUMNS.map((column) => column.label);
    expect(labels.slice(labels.indexOf("AF") + 1, labels.indexOf("AF") + 8)).toEqual(["Sh", "SoT", "KP", "BCC", "BCM", "Crs", "AC"]);
  });

  it("reads a man's season out of the bag it was joined into", () => {
    const bag = seasonStats(HAALAND);
    expect(SEASON_COLUMNS.map((column) => column.value({} as never, bag))).toEqual([20, 10, 1, 1, 4, 0, 0]);
  });

  it("dashes a man the file does not hold, and prints a played man's noughts", () => {
    expect(seasonStats(undefined)).toEqual({});
    expect(columnFor("sh")?.value({} as never, seasonStats(undefined))).toBeNull();
    expect(columnFor("cr")?.value({} as never, seasonStats(HAALAND))).toBe(0);
  });

  it("dashes a keeper's shots, which his half never carries, and keeps his nought chances", () => {
    const bag = seasonStats(KEEPER);
    expect(columnFor("sh")?.value({} as never, bag)).toBeNull();
    expect(columnFor("sot")?.value({} as never, bag)).toBeNull();
    expect(columnFor("kp")?.value({} as never, bag)).toBe(0);
  });

  it("sits under Attacking and on All, and a served league that scores none of them never drops one", () => {
    const keys = (group: "attacking" | "all") => columnsIn(group, "fpts", REAL).map((column) => column.key);
    expect(keys("attacking")).toEqual(expect.arrayContaining(KEYS));
    expect(keys("all")).toEqual(expect.arrayContaining(KEYS));
    expect(columnsIn("defensive", "fpts", REAL).some((column) => KEYS.includes(column.key))).toBe(false);
    expect(sortableIn(REAL).map((column) => column.key)).toEqual(expect.arrayContaining(KEYS));
  });

  it("lights the most big chances missed at the bad end, and the rest at the good", () => {
    expect(SEASON_COLUMNS.map((column) => column.mark)).toEqual(["high", "high", "high", "high", "low", "high", "high"]);
  });

  it("rates per 90 over the file's own minutes, not the served league's", () => {
    const shots = columnFor("sh");
    // A live gameweek: the served read has a match the daily file has not caught up with.
    const bag = { Min: 540, ...seasonStats(HAALAND) };
    expect(shots && figureOf(shots, row("haaland"), bag, true)).toBe(4);
    expect(shots && figureOf(shots, row("haaland"), bag, false)).toBe(20);
  });

  it("prints a player's season for his Data page in the board's order", () => {
    expect(seasonLine(HAALAND).map((entry) => `${entry.label} ${entry.figure}`)).toEqual([
      "Sh 20", "SoT 10", "KP 1", "BCC 1", "BCM 4", "Crs 0", "AC 0",
    ]);
  });

  it("dashes every figure on his page when the file does not hold him", () => {
    expect(seasonLine(undefined).map((entry) => entry.figure)).toEqual(Array(7).fill(DASH));
  });

  it("dashes a keeper's shots and crosses on his page, and prints his noughts", () => {
    expect(seasonLine(KEEPER).map((entry) => entry.figure)).toEqual([DASH, DASH, "0", DASH, DASH, DASH, DASH]);
  });

  it("sorts by shots either way with a man the file does not hold last", () => {
    const raw = new Map([
      ["haaland", seasonStats(HAALAND)],
      ["wirtz", seasonStats({ minutes: 415, shots: 15 })],
      ["unplayed", seasonStats(undefined)],
    ]);
    const rows = [row("unplayed"), row("wirtz"), row("haaland")];
    const order = (dir: string) => shownRows(rows, { sort: "sh", dir }, raw).map((each) => each.entry.player.fantraxId);
    expect(order("desc")).toEqual(["haaland", "wirtz", "unplayed"]);
    expect(order("asc")).toEqual(["wirtz", "haaland", "unplayed"]);
  });
});
