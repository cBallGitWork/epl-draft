import { describe, expect, it } from "vitest";
import recorded from "./__fixtures__/fixtureStats.json";
import type { RawFixture } from "./fpl/raw";
import { mapMatchSheets, scoresheet, sheetSides } from "./matchSheet";
import type { FootballPlayer, FootballSnapshot } from "./types";

// Recorded from `/api/fixtures/`: fixture 11 finished 1-4 in gameweek 2, and fixture 21 has not started.
const [PLAYED, UNSTARTED] = recorded as unknown as RawFixture[];

const sheets = mapMatchSheets([PLAYED, UNSTARTED]);
const [played, unstarted] = sheets;

describe("mapMatchSheets", () => {
  it("gives one sheet per fixture, keyed by the fixture", () => {
    expect(sheets).toHaveLength(2);
    expect(played.fixtureId).toBe(PLAYED.id);
    expect(unstarted.fixtureId).toBe(UNSTARTED.id);
  });

  it("reads a match nobody has played as empty rather than throwing", () => {
    // FPL sends `stats: []` for an unstarted fixture: an empty sheet, not an error.
    expect(UNSTARTED.stats).toEqual([]);
    expect(unstarted.lines).toEqual([]);
  });

  it("lists exactly the men who appeared, and no one else", () => {
    // The bps block is the appearance list: 32 men, matching `/event/2/live/` exactly.
    expect(played.lines).toHaveLength(32);
    expect(played.lines.filter((l) => l.side === "home")).toHaveLength(16);
    expect(played.lines.filter((l) => l.side === "away")).toHaveLength(16);

    // Presence in the bps block is the appearance, not the figure, which runs negative.
    const inBps = new Set(
      (PLAYED.stats ?? [])
        .filter((s) => s.identifier === "bps")
        .flatMap((s) => [...s.h, ...s.a])
        .map((e) => e.element),
    );
    expect(inBps.size).toBe(32);
    expect(played.lines.every((l) => inBps.has(l.playerId))).toBe(true);
    expect(played.lines.some((l) => l.bps < 0)).toBe(true);
  });

  it("keeps a player on the side the fixture list put him, not his club's", () => {
    // The side is stated by the payload, never derived from bootstrap's club.
    const scorer = played.lines.find((l) => l.playerId === 399);
    expect(scorer?.side).toBe("away");
    expect(scorer?.goals).toBe(2);
  });

  it("carries the assist, which is the half CM's own overview leaves out", () => {
    const assists = played.lines.filter((l) => l.assists > 0);
    expect(assists.map((l) => l.playerId).sort((a, b) => a - b)).toEqual([
      211, 391, 397, 398,
    ]);
    expect(assists.find((l) => l.playerId === 398)?.assists).toBe(2);
  });

  it("counts a booking and an own goal without inventing either", () => {
    expect(played.lines.filter((l) => l.yellowCards > 0)).toHaveLength(3);
    expect(played.lines.filter((l) => l.redCards > 0)).toHaveLength(0);
    expect(played.lines.filter((l) => l.ownGoals > 0).map((l) => l.playerId)).toEqual([384]);
  });

  it("ignores an identifier it does not declare", () => {
    // A new identifier must not land in a field nobody declared.
    const [sheet] = mapMatchSheets([
      { ...PLAYED, stats: [{ identifier: "invented_stat", h: [{ value: 9, element: 1 }], a: [] }] },
    ]);
    expect(sheet.lines).toEqual([]);
  });
});

describe("sheetSides", () => {
  it("splits the sheet and puts each side by name, never in FPL's bonus-points order", () => {
    const { home, away } = sheetSides(played, snapshotOf(played.lines.map((l) => l.playerId)));
    expect(home).toHaveLength(16);
    expect(away).toHaveLength(16);
    for (const side of [home, away]) {
      const names = side.map((r) => r.player.name);
      expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
    }
  });

  it("drops a man the snapshot does not carry rather than taking the screen down", () => {
    // FPL has sent an element bootstrap does not list: one man short beats a 500.
    const short = snapshotOf(played.lines.slice(1).map((l) => l.playerId));
    const { home, away } = sheetSides(played, short);
    expect(home.length + away.length).toBe(31);
  });
});

describe("scoresheet", () => {
  const { home, away } = sheetSides(played, snapshotOf(played.lines.map((l) => l.playerId)));

  it("names only the men a scoresheet names", () => {
    // Scorers, assisters and an own goal, against sixteen who merely turned out.
    const named = scoresheet(away).map((r) => r.line.playerId);
    expect(named).toContain(399);
    expect(named).toContain(398);
    expect(named).toContain(384);
    expect(named.length).toBeLessThan(away.length);
  });

  it("does not name a man for a booking alone", () => {
    // A yellow card is shown elsewhere; the scoresheet is who scored and when.
    const booked = away.filter(
      (r) => r.line.yellowCards > 0 && r.line.goals === 0 && r.line.assists === 0,
    );
    expect(booked.length).toBeGreaterThan(0);
    const named = new Set(scoresheet(away).map((r) => r.line.playerId));
    for (const man of booked) expect(named.has(man.line.playerId)).toBe(false);
  });

  it("still names a man sent off", () => {
    // A red card changes a match, so it stays on the sheet where a yellow does not.
    const sent = { ...away[0].line, goals: 0, assists: 0, yellowCards: 0, redCards: 1 };
    expect(scoresheet([{ ...away[0], line: sent }])).toHaveLength(1);
  });

  it("leaves out a keeper's saves", () => {
    // Saves belong in a column beside every name; four saves is not an entry on the scoresheet.
    const keeper = home.find((r) => r.line.saves >= 4);
    expect(keeper).toBeDefined();
    expect(scoresheet(home).map((r) => r.line.playerId)).not.toContain(keeper?.line.playerId);
  });

  it("puts goals above assists above bookings", () => {
    const ranked = scoresheet(away);
    expect(ranked[0].line.goals).toBeGreaterThan(0);
    expect(ranked[ranked.length - 1].line.goals).toBe(0);
  });
});

/** A snapshot carrying only `players`, the one field `sheetSides` reads. */
function snapshotOf(ids: readonly number[]): FootballSnapshot {
  const players = ids.map((id) => ({
    id,
    code: id * 10,
    name: `Player ${id}`,
  })) as unknown as FootballPlayer[];
  return { players } as unknown as FootballSnapshot;
}
