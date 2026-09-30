import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mapDraftPicks } from "@epl/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fingerprint, leagueKeys, mapperFor, replayLeague } from "./fingerprints";

// The replay harness over a two-day archive written to a temp directory: no data/, no network.

/** sha256 of `[]`, which is what a pre-draft league's picks and an empty log both map to. */
const EMPTY = "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";

const completed = {
  draftState: "completed",
  draftPicks: [{ round: 1, pick: 1, teamId: "team-a", playerId: "061vq" }],
};

let root: string;

function day(date: string, reads: Record<string, { ok: boolean; body?: unknown }>): void {
  const dir = join(root, date);
  mkdirSync(dir, { recursive: true });
  const manifest = Object.entries(reads).map(([method, { ok }]) => ({ method, ok }));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ reads: manifest }));
  for (const [method, { body }] of Object.entries(reads)) {
    if (body !== undefined) writeFileSync(join(dir, `${method}.json`), JSON.stringify(body));
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "replay-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("mapperFor", () => {
  it("names a mapper for each league read the capture keeps", () => {
    for (const method of [
      "getLeagueInfo",
      "getTeamRosters",
      "getDraftResults",
      "getTransactionDetailsHistory-CLAIM_DROP",
      "getTransactionDetailsHistory-TRADE",
      "getTransactionDetailsHistory-LINEUP_CHANGE",
    ]) {
      expect(mapperFor(method), method).not.toBeNull();
    }
  });

  it("has none for the fxea standings, or a view it does not know", () => {
    expect(mapperFor("getStandings")).toBeNull();
    expect(mapperFor("getTransactionDetailsHistory-WAIVER")).toBeNull();
  });
});

describe("fingerprint", () => {
  it("is the sha256 of the mapped value's JSON", () => {
    expect(fingerprint([])).toBe(EMPTY);
    expect(fingerprint(mapDraftPicks(completed))).not.toBe(EMPTY);
  });
});

describe("replayLeague", () => {
  it("fingerprints each answered, mapped read, by day and then by method", async () => {
    day("2026-09-02", {
      "getTransactionDetailsHistory-TRADE": { ok: true, body: { table: { rows: [] } } },
      getDraftResults: { ok: true, body: completed },
      getStandings: { ok: true, body: [] },
      getTeamRosters: { ok: false, body: { rosters: { "team-a": { teamName: "A" } } } },
    });
    day("2026-09-01", { getDraftResults: { ok: true, body: { draftState: "in_progress" } } });
    mkdirSync(join(root, "notes"));

    expect(await replayLeague("alpha", root)).toEqual([
      `alpha/2026-09-01/getDraftResults.json ${EMPTY}`,
      `alpha/2026-09-02/getDraftResults.json ${fingerprint(mapDraftPicks(completed))}`,
      `alpha/2026-09-02/getTransactionDetailsHistory-TRADE.json ${EMPTY}`,
    ]);
  });

  it("answers the same lines on a second run", async () => {
    day("2026-09-01", { getDraftResults: { ok: true, body: completed } });
    expect(await replayLeague("alpha", root)).toEqual(await replayLeague("alpha", root));
  });

  it("has nothing to say for a league never captured", async () => {
    expect(await replayLeague("alpha", join(root, "absent"))).toEqual([]);
  });
});

describe("leagueKeys", () => {
  it("keeps the recorded order, then adds any other archive on disk by name", async () => {
    for (const key of ["real", "zeta-abandoned", "dummy"]) mkdirSync(join(root, key));
    writeFileSync(join(root, "README"), "");
    expect(await leagueKeys(["rehearsal", "real"], root)).toEqual([
      "rehearsal",
      "real",
      "dummy",
      "zeta-abandoned",
    ]);
  });
});
