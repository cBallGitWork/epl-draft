import { describe, expect, it } from "vitest";
import { horizonAfter, momentOf, teamPlan } from "./plan";
import { benchOrderRun, type Deps } from "./run";

// A roster page as getTeamRosterInfo files it: an eleven of one, a bench with total points, and the bench numbers.
const roster = (period: number, bench: [string, string | null][], numbers: Record<string, number> = {}) => ({
  displayedSelections: { displayedPeriod: String(period) },
  miscData: { autoSubOrderMap: numbers, statusTotals: [{ name: "Active", id: "1" }, { name: "Reserve", id: "2" }] },
  tables: [
    {
      header: { cells: [{ key: "opponent" }, { key: "fpts" }] },
      rows: [
        { posId: "703", statusId: "1", scorer: { scorerId: "xi", shortName: "Starter", posIds: ["703"], posShortNames: "D" }, cells: [{ content: "EVE" }, { content: "50" }] },
        ...bench.map(([id, fpts]) => ({
          posId: "702",
          statusId: "2",
          scorer: { scorerId: id, shortName: id.toUpperCase(), posIds: ["702"], posShortNames: "M" },
          cells: [{ content: "EVE" }, ...(fpts === null ? [] : [{ content: fpts }])],
        })),
      ],
    },
  ],
});

const LOCK = "2026-10-10T11:15:00.000Z";
const at = (iso: string) => Date.parse(iso);

/** A fake Fantrax and clock: `rosters` by team, numbers written back into them as Fantrax would hold them. */
function league(start: string, rosters: Record<string, ReturnType<typeof roster>>, over: Partial<Deps> = {}) {
  let clock = at(start);
  const writes: { teamId: string; map: Record<string, number> }[] = [];
  const lines: string[] = [];
  const deps: Deps = {
    now: () => clock,
    sleep: async (ms) => void (clock += ms),
    next: async () => ({ period: 6, lock: LOCK }),
    lockOf: async () => LOCK,
    teams: async () => Object.keys(rosters).map((teamId) => ({ teamId, name: teamId })),
    roster: async (teamId) => rosters[teamId],
    write: async (teamId, _period, map) => {
      writes.push({ teamId, map });
      rosters[teamId].miscData.autoSubOrderMap = map;
      return { ok: true };
    },
    log: (line) => void lines.push(line),
    ...over,
  };
  return { deps, writes, lines, advance: (ms: number) => void (clock += ms), clock: () => clock };
}

const FIVE_TO = "2026-10-10T11:10:00.000Z";

describe("teamPlan", () => {
  it("numbers a bench nobody numbered by total points, highest first, ties in the page's order", () => {
    expect(teamPlan(roster(6, [["a", "3"], ["b", "12"], ["c", "3"], ["d", "-1"]]), 6)).toEqual({
      kind: "write",
      order: ["b", "a", "c", "d"],
      map: { b: 1, a: 2, c: 3, d: 4 },
    });
  });

  it("puts a man with no points reading last", () => {
    expect(teamPlan(roster(6, [["a", null], ["b", "-2"], ["c", "0"]]), 6)).toMatchObject({ order: ["c", "b", "a"] });
  });

  it("leaves a numbered bench alone, a partly numbered one too", () => {
    expect(teamPlan(roster(6, [["a", "3"], ["b", "12"]], { a: 1, b: 2 }), 6)).toEqual({ kind: "numbered", order: ["a", "b"] });
    expect(teamPlan(roster(6, [["a", "3"], ["b", "12"], ["c", "1"]], { c: 1 }), 6)).toEqual({ kind: "numbered", order: ["c"] });
  });

  it("reads all noughts as unnumbered", () => {
    expect(teamPlan(roster(6, [["a", "3"], ["b", "12"]], { a: 0, b: 0 }), 6)).toMatchObject({ kind: "write", order: ["b", "a"] });
  });

  it("never plans a write on a roster Fantrax filed under another period", () => {
    expect(teamPlan(roster(7, [["a", "3"]]), 6)).toEqual({ kind: "unread", period: 7 });
    expect(teamPlan({}, 6)).toEqual({ kind: "unread", period: null });
  });
});

describe("momentOf", () => {
  it("writes five minutes before the lock and never at or after it", () => {
    expect(momentOf(LOCK, at("2026-10-10T11:09:59.000Z"))).toEqual({ kind: "wait", lock: LOCK, ms: 1000 });
    expect(momentOf(LOCK, at(FIVE_TO))).toEqual({ kind: "now", lock: LOCK });
    expect(momentOf(LOCK, at(LOCK))).toEqual({ kind: "locked", lock: LOCK });
  });

  it("waits for a lock that day or before 08:00 the next, and leaves a later one to tomorrow's run", () => {
    expect(momentOf(LOCK, at("2026-10-10T06:00:00.000Z")).kind).toBe("wait");
    expect(momentOf("2026-10-11T06:55:00.000Z", at("2026-10-10T06:00:00.000Z")).kind).toBe("wait");
    expect(momentOf("2026-10-11T07:05:00.000Z", at("2026-10-10T06:00:00.000Z")).kind).toBe("not-due");
  });

  it("has no lock at the season's end or on an unreadable one", () => {
    expect(momentOf(null, at(FIVE_TO))).toEqual({ kind: "no-lock" });
    expect(momentOf("soon", at(FIVE_TO))).toEqual({ kind: "no-lock" });
  });
});

describe("horizonAfter", () => {
  it("is tomorrow's 08:00 in London, across the clocks going back on 25 Oct", () => {
    expect(new Date(horizonAfter(at("2026-10-10T06:00:00.000Z"))).toISOString()).toBe("2026-10-11T07:00:00.000Z");
    // Saturday 24 Oct, 07:00 BST: Sunday's 08:00 is GMT.
    expect(new Date(horizonAfter(at("2026-10-24T06:00:00.000Z"))).toISOString()).toBe("2026-10-25T08:00:00.000Z");
    // Sunday 25 Oct, 07:00 GMT.
    expect(new Date(horizonAfter(at("2026-10-25T07:00:00.000Z"))).toISOString()).toBe("2026-10-26T08:00:00.000Z");
    // A 07:55 GMT lock on Sunday is 08:55 BST on Saturday's clock, and still Saturday's run's to wait for.
    expect(momentOf("2026-10-25T07:55:00.000Z", at("2026-10-24T06:00:00.000Z")).kind).toBe("wait");
  });
});

describe("benchOrderRun", () => {
  const rosters = () => ({
    none: roster(6, [["a", "3"], ["b", "12"]]),
    mine: roster(6, [["c", "3"], ["d", "12"]], { c: 1, d: 2 }),
    part: roster(6, [["e", "3"], ["f", "12"]], { e: 1 }),
  });

  it("writes only the teams nobody numbered, in points order", async () => {
    const run = league(FIVE_TO, rosters());
    expect(await benchOrderRun(run.deps, { write: true, wait: false })).toBe(0);
    expect(run.writes).toEqual([{ teamId: "none", map: { b: 1, a: 2 } }]);
  });

  it("writes nothing on a dry run, and still prints each team's plan", async () => {
    const run = league("2026-10-09T20:00:00.000Z", rosters());
    expect(await benchOrderRun(run.deps, { write: false, wait: false })).toBe(0);
    expect(run.writes).toEqual([]);
    expect(run.lines.join("\n")).toContain("none: would write 1 B (12), 2 A (3)");
    expect(run.lines.join("\n")).toContain("mine: numbered already");
  });

  it("waits until five minutes before the lock, then writes once", async () => {
    const run = league("2026-10-10T06:00:00.000Z", rosters());
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(0);
    expect(new Date(run.clock()).toISOString()).toBe(FIVE_TO);
    expect(run.writes).toHaveLength(1);
  });

  it("writes nothing when the next lock is after tomorrow's run", async () => {
    const run = league("2026-10-09T06:00:00.000Z", rosters());
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(0);
    expect(run.writes).toEqual([]);
    expect(run.clock()).toBe(at("2026-10-09T06:00:00.000Z"));
  });

  it("refuses an early write without the wait", async () => {
    const run = league("2026-10-10T06:00:00.000Z", rosters());
    expect(await benchOrderRun(run.deps, { write: true, wait: false })).toBe(0);
    expect(run.writes).toEqual([]);
  });

  it("fails and writes nothing when it wakes after the lock", async () => {
    const run = league("2026-10-10T06:00:00.000Z", rosters());
    run.deps.sleep = async (ms) => run.advance(ms + 10 * 60_000);
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(1);
    expect(run.writes).toEqual([]);
  });

  it("fails and writes nothing when the lock moved earlier while it slept, past the moment it wakes", async () => {
    const run = league("2026-10-10T06:00:00.000Z", rosters(), { lockOf: async () => "2026-10-10T08:00:00.000Z" });
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(1);
    expect(run.writes).toEqual([]);
  });

  it("fails and writes nothing when the period's lock is gone when it wakes", async () => {
    const run = league("2026-10-10T06:00:00.000Z", rosters(), { lockOf: async () => null });
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(1);
    expect(run.writes).toEqual([]);
  });

  it("waits again for a lock moved later while it slept", async () => {
    const later = "2026-10-10T13:15:00.000Z";
    const run = league("2026-10-10T06:00:00.000Z", rosters(), { lockOf: async () => later });
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(0);
    expect(new Date(run.clock()).toISOString()).toBe("2026-10-10T13:10:00.000Z");
    expect(run.writes).toHaveLength(1);
  });

  it("never writes a team after the period locks mid-run", async () => {
    const many = { ...rosters(), late: roster(6, [["g", "1"], ["h", "2"]]) };
    const run = league("2026-10-10T11:14:59.000Z", many);
    run.deps.roster = async (teamId) => (run.advance(1000), many[teamId as keyof typeof many]);
    expect(await benchOrderRun(run.deps, { write: true, wait: false })).toBe(1);
    expect(run.writes).toEqual([]);
  });

  it("exits non-zero when Fantrax refuses the write, as an expired cookie does", async () => {
    const refused = league(FIVE_TO, rosters(), { write: async () => ({ ok: false, messages: ["Not logged in"] }) });
    expect(await benchOrderRun(refused.deps, { write: true, wait: false })).toBe(1);
    const thrown = league(FIVE_TO, rosters(), {
      write: async () => {
        throw new Error("WARNING_NOT_LOGGED_IN");
      },
    });
    expect(await benchOrderRun(thrown.deps, { write: true, wait: false })).toBe(1);
  });

  it("exits non-zero on a roster filed under another period", async () => {
    const run = league(FIVE_TO, { stale: roster(5, [["a", "1"]]) });
    expect(await benchOrderRun(run.deps, { write: true, wait: false })).toBe(1);
    expect(run.writes).toEqual([]);
  });

  it("does nothing at the season's end", async () => {
    const run = league(FIVE_TO, rosters(), { next: async () => null });
    expect(await benchOrderRun(run.deps, { write: true, wait: true })).toBe(0);
    expect(run.writes).toEqual([]);
  });

  it("writes nothing new on a second run: the bench it numbered reads as numbered", async () => {
    const held = rosters();
    const first = league(FIVE_TO, held);
    await benchOrderRun(first.deps, { write: true, wait: false });
    const second = league(FIVE_TO, held);
    expect(await benchOrderRun(second.deps, { write: true, wait: false })).toBe(0);
    expect(second.writes).toEqual([]);
  });
});
