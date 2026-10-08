import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureReads, drafted, everyDayCaptured, excused } from "./snapshots";

// The capture days on disk, over a temp directory laid out as data/snapshots is: `<league>/<YYYY-MM-DD>/`.

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "snapshots-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

interface Read {
  method?: string;
  ok: boolean;
  code?: string;
}

/** One capture day: its manifest, and the draft board when the day recorded one. */
function day(league: string, date: string, reads: Read[], draftState?: string): string {
  const dir = join(root, league, date);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ reads }));
  if (draftState !== undefined) {
    writeFileSync(join(dir, "getDraftResults.json"), JSON.stringify({ draftState, draftPicks: [] }));
  }
  return dir;
}

const ANSWERED = { method: "getLeagueInfo", ok: true };
const NO_TEAMS = { method: "getTeamRosters", ok: false, code: "NO_TEAMS" };
const UNAVAILABLE = { method: "getTeamRosters", ok: false, code: "503" };

describe("excused", () => {
  it("lets NO_TEAMS stand while the league has not drafted", () => {
    expect(excused("NO_TEAMS", false)).toBe(true);
  });

  it("never lets NO_TEAMS stand once the league has drafted", () => {
    expect(excused("NO_TEAMS", true)).toBe(false);
  });

  it("never lets any other failure stand, before the draft or after", () => {
    for (const code of ["503", "INVALID_LEAGUE_ID", "TIMEOUT", null]) {
      expect(excused(code, false)).toBe(false);
      expect(excused(code, true)).toBe(false);
    }
  });
});

describe("drafted", () => {
  it("answers the newest capture that recorded the draft", () => {
    day("real", "2026-10-02", [ANSWERED], "running");
    day("real", "2026-10-05", [ANSWERED], "completed");
    // A day whose draft read failed says nothing either way, so the day before it stands.
    day("real", "2026-10-06", [ANSWERED]);
    return expect(drafted(join(root, "real"))).resolves.toBe(true);
  });

  it("is false while the newest recorded draft is still running", () => {
    day("real", "2026-10-02", [ANSWERED], "running");
    return expect(drafted(join(root, "real"))).resolves.toBe(false);
  });

  it("is false for a league with no captures at all", () => {
    return expect(drafted(join(root, "never"))).resolves.toBe(false);
  });
});

describe("captureReads", () => {
  it("names each failed read and the code it failed with", async () => {
    const dir = day("real", "2026-10-08", [ANSWERED, UNAVAILABLE, { method: "getStandings", ok: false }]);
    expect(await captureReads(dir)).toEqual({
      ok: 1,
      failed: [
        { method: "getTeamRosters", code: "503" },
        { method: "getStandings", code: null },
      ],
    });
  });

  it("cannot say what a day without a readable manifest recorded", async () => {
    expect(await captureReads(join(root, "missing"))).toBeNull();
  });
});

describe("everyDayCaptured", () => {
  it("is true when every read of every directory answered", async () => {
    const dirs = [day("real", "2026-10-08", [ANSWERED, ANSWERED], "completed"), day("pool", "2026-10-08", [ANSWERED])];
    expect(await everyDayCaptured(dirs)).toBe(true);
  });

  it("is false when a drafted league's day failed one read, so the backup takes it again", async () => {
    const dirs = [day("real", "2026-10-08", [ANSWERED, UNAVAILABLE], "completed"), day("pool", "2026-10-08", [ANSWERED])];
    expect(await everyDayCaptured(dirs)).toBe(false);
  });

  it("is false when a drafted league's squads were refused NO_TEAMS", async () => {
    expect(await everyDayCaptured([day("real", "2026-10-08", [ANSWERED, NO_TEAMS], "completed")])).toBe(false);
  });

  it("is true when the only failure is NO_TEAMS before the league's draft", async () => {
    expect(await everyDayCaptured([day("real", "2026-10-08", [ANSWERED, NO_TEAMS], "running")])).toBe(true);
  });

  it("is false when one directory recorded nothing", async () => {
    const dirs = [day("real", "2026-10-08", [ANSWERED], "completed"), day("pool", "2026-10-08", [{ ok: false }])];
    expect(await everyDayCaptured(dirs)).toBe(false);
  });

  it("is false when a directory was never written", async () => {
    const dirs = [day("real", "2026-10-08", [ANSWERED], "completed"), join(root, "pool", "2026-10-08")];
    expect(await everyDayCaptured(dirs)).toBe(false);
  });
});
