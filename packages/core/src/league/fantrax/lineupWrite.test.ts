import { describe, expect, it } from "vitest";
import type { RosterSlot } from "../types";
import roster from "./__fixtures__/lineupState.json";
import saved from "./__fixtures__/lineupSaved.json";
import {
  benchOrderMap,
  benchToWrite,
  changesBenchOrder,
  changesLineup,
  fieldMapFor,
  lineupChanges,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
  stillHeld,
  type LineupState,
} from "./lineupWrite";

// The fixture is a real `getTeamRosterInfo` for one team, trimmed to the fields the save reads.
const read = mapLineupState(roster) as LineupState;
const STATUS: Record<string, string> = { "1": "ACTIVE", "2": "RESERVE" };
const POSITION: Record<string, string> = { "701": "F", "702": "M", "703": "D", "704": "G" };
const asIs = (): RosterSlot[] =>
  read.rows.map((row) => ({ fantraxId: row.scorerId, position: POSITION[row.posId]!, status: STATUS[row.statusId]! }));
const move = (plan: RosterSlot[], id: string, patch: Partial<RosterSlot>) =>
  plan.map((slot) => (slot.fantraxId === id ? { ...slot, ...patch } : slot));

describe("mapLineupState", () => {
  it("reads every man, skipping the secondary rows", () => {
    expect(read.rows).toHaveLength(15);
    expect(read.period).toBe(6);
  });

  it("zips a dual-eligible man's ids with his short names", () => {
    const saka = read.rows.find((row) => row.scorerId === "04y92")!;
    expect(Object.fromEntries(saka.positions)).toEqual({ M: "702", F: "701" });
  });

  it("reads status ids and the league's apply-to-future default off the payload", () => {
    expect(Object.fromEntries(read.statusIds)).toEqual({ ACTIVE: "1", RESERVE: "2" });
    expect(read.applyToFuturePeriods).toBe(true);
  });

  it("refuses a shape it does not know", () => {
    expect(mapLineupState({})).toBeNull();
    expect(mapLineupState(null)).toBeNull();
  });
});

describe("fieldMapFor", () => {
  it("sends every man, unchanged when nothing moved", () => {
    const map = fieldMapFor(read, asIs());
    expect(Object.keys(map)).toHaveLength(15);
    expect(changesLineup(read, map as never)).toBe(false);
  });

  it("carries a swap as two changed statuses", () => {
    const plan = move(move(asIs(), "04qfz", { status: "RESERVE" }), "05l27", { status: "ACTIVE" });
    const map = fieldMapFor(read, plan);
    expect(map).toMatchObject({ "04qfz": { posId: "703", stId: "2" }, "05l27": { posId: "703", stId: "1" } });
    expect(changesLineup(read, map as never)).toBe(true);
  });

  it("moves a dual-eligible man by his own position id", () => {
    expect(fieldMapFor(read, move(asIs(), "04y92", { position: "M" }))).toMatchObject({ "04y92": { posId: "702" } });
  });

  it("refuses a position he is not eligible at", () => {
    expect(fieldMapFor(read, move(asIs(), "045ob", { position: "F" }))).toBe("not-eligible");
  });

  it("refuses when the squad no longer matches the plan", () => {
    expect(fieldMapFor(read, asIs().slice(1))).toBe("squad-changed");
    expect(fieldMapFor(read, [...asIs().slice(1), { fantraxId: "zzzzz", position: "G", status: "RESERVE" }])).toBe(
      "squad-changed",
    );
  });

  it("refuses a status Fantrax does not list", () => {
    expect(fieldMapFor(read, move(asIs(), "045ob", { status: "INJURED_RESERVE" }))).toBe("unknown-status");
  });
});

describe("lineupChanges", () => {
  it("lists nobody when nothing moved", () => {
    expect(lineupChanges(read, fieldMapFor(read, asIs()) as never)).toEqual([]);
  });

  it("lists each man the plan moves, from where Fantrax has him to where the plan puts him", () => {
    const plan = move(move(move(asIs(), "04qfz", { status: "RESERVE" }), "05l27", { status: "ACTIVE" }), "04y92", { position: "M" });
    expect(lineupChanges(read, fieldMapFor(read, plan) as never)).toEqual(
      expect.arrayContaining([
        { scorerId: "04qfz", from: { posId: "703", stId: "1" }, to: { posId: "703", stId: "2" } },
        { scorerId: "05l27", from: { posId: "703", stId: "2" }, to: { posId: "703", stId: "1" } },
        { scorerId: "04y92", from: { posId: "701", stId: "1" }, to: { posId: "702", stId: "1" } },
      ]),
    );
    expect(lineupChanges(read, fieldMapFor(read, plan) as never)).toHaveLength(3);
  });
});

describe("the bench order", () => {
  it("ranks from 1 and zeroes a ranked man who left the bench", () => {
    expect(benchOrderMap(["a", "b"], { c: 1, a: 2 })).toEqual({ c: 0, a: 1, b: 2 });
  });

  it("changes only when a rank differs", () => {
    expect(changesBenchOrder(["a", "b"], { a: 1, b: 2 })).toBe(false);
    expect(changesBenchOrder(["b", "a"], { a: 1, b: 2 })).toBe(true);
    expect(changesBenchOrder(["a"], {})).toBe(true);
  });
});

describe("benchToWrite", () => {
  it("leaves an unnumbered bench to Fantrax's points order when the manager only moved his eleven", () => {
    expect(benchToWrite(["gk2", "d5", "m5", "f3"], false, {})).toBeNull();
  });

  it("numbers an unnumbered bench the manager reordered", () => {
    expect(benchToWrite(["m5", "d5"], true, {})).toEqual({ m5: 1, d5: 2 });
  });

  it("keeps a numbered bench's numbers true when who is on it changes", () => {
    expect(benchToWrite(["a", "d"], false, { a: 1, c: 2 })).toEqual({ a: 1, c: 0, d: 2 });
    expect(benchToWrite(["a", "c"], false, { a: 1, c: 2 })).toBeNull();
  });

  it("treats a bench numbered only with noughts as unnumbered", () => {
    expect(benchToWrite(["a", "b"], false, { a: 0, c: 0 })).toBeNull();
  });
});

describe("stillHeld", () => {
  const reserves = read.rows.filter((row) => row.statusId === "2").map((row) => row.scorerId);

  it("passes a page planned from what Fantrax still holds", () => {
    expect(stillHeld(read, { slots: asIs(), bench: reserves })).toBe(true);
  });

  it("refuses a page planned before a lineup change made in Fantrax", () => {
    const before = move(move(asIs(), "04qfz", { status: "RESERVE" }), "05l27", { status: "ACTIVE" });
    expect(stillHeld(read, { slots: before, bench: reserves })).toBe(false);
    expect(stillHeld(read, { slots: asIs().slice(1), bench: reserves })).toBe(false);
  });

  it("refuses a page planned before the bench was renumbered in Fantrax, and ignores an unnumbered man's place", () => {
    const [a, b, c] = reserves;
    const numbered = { ...read, autoSubOrder: { [b!]: 1, [a!]: 2 } };
    expect(stillHeld(numbered, { slots: asIs(), bench: [a!, b!, c!] })).toBe(false);
    expect(stillHeld(numbered, { slots: asIs(), bench: [b!, a!, c!] })).toBe(true);
    expect(stillHeld(numbered, { slots: asIs(), bench: [c!, b!, a!] })).toBe(true);
  });
});

describe("readLineupAnswer", () => {
  it("accepts the executed swap Fantrax answered on 28 Sep", () => {
    expect(readLineupAnswer(saved)).toEqual({ ok: true });
  });

  it("refuses a warning and says why", () => {
    const warning = {
      fantasyResponse: { msgType: "WARNING", mainMsg: "Your roster will be <b>illegal</b>" },
      textArray: { model: { illegalRosterMsgs: ["The minimum number of <b>3</b> active <b>D</b> position(s) will not be met."] } },
    };
    expect(readLineupAnswer(warning)).toEqual({
      ok: false,
      messages: ["The minimum number of 3 active D position(s) will not be met.", "Your roster will be illegal"],
    });
  });

  it("refuses a confirm that still carries an illegal message", () => {
    const answer = { fantasyResponse: { msgType: "CONFIRM", illegalRosterMsgs: ["Too many F"] } };
    expect(readLineupAnswer(answer)).toEqual({ ok: false, messages: ["Too many F"] });
  });

  it("refuses an answer it cannot read", () => {
    expect(readLineupAnswer(null).ok).toBe(false);
  });
});

describe("readBenchAnswer", () => {
  it("reads success and failure", () => {
    expect(readBenchAnswer({ success: true })).toEqual({ ok: true });
    expect(readBenchAnswer({ success: false, fantasyResponse: { mainMsg: "No" } })).toEqual({ ok: false, messages: ["No"] });
  });
});
