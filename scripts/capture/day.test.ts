import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FantraxError, ProviderError } from "@epl/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CaptureRead, type CaptureTarget, captureDay } from "./day";

// The day's capture over a temp directory: no data/, no network.

const CAPTURED_AT = "2026-10-03T05:10:00.000Z";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "capture-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function answers(method: string, body: unknown = { method }): CaptureRead {
  return { method, run: () => Promise.resolve(body) };
}

function fails(method: string, error: Error): CaptureRead {
  return { method, run: () => Promise.reject(error) };
}

function league(key: string, reads: CaptureRead[]): CaptureTarget {
  return { label: key, dir: join(root, key), leagueId: `${key}-id`, reads };
}

function manifest(key: string): { capturedAt: string; leagueId: string; reads: unknown[] } {
  return JSON.parse(readFileSync(join(root, key, "manifest.json"), "utf8"));
}

describe("captureDay", () => {
  it("writes each read and a manifest per league, all under one timestamp", async () => {
    const outcomes = await captureDay(
      [league("real", [answers("getLeagueInfo")]), league("dummy", [answers("getLeagueInfo")])],
      CAPTURED_AT,
    );
    expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
    expect(JSON.parse(readFileSync(join(root, "dummy", "getLeagueInfo.json"), "utf8"))).toEqual({
      method: "getLeagueInfo",
    });
    expect(manifest("real")).toMatchObject({ capturedAt: CAPTURED_AT, leagueId: "real-id" });
  });

  it("records a Fantrax refusal in the manifest and keeps reading", async () => {
    const refused = new FantraxError("getTeamRosters", "NO_TEAMS", "none");
    await captureDay(
      [league("real", [fails("getTeamRosters", refused), answers("getStandings")])],
      CAPTURED_AT,
    );
    expect(manifest("real").reads).toEqual([
      expect.objectContaining({ method: "getTeamRosters", ok: false, code: "NO_TEAMS" }),
      expect.objectContaining({ method: "getStandings", ok: true }),
    ]);
  });

  it("keeps every other league when one league's read drops its connection", async () => {
    const dropped = new ProviderError("ECONNRESET", "www.fantrax.com /fxea/general/getStandings");
    const real = [answers("getLeagueInfo"), fails("getStandings", dropped), answers("getDraftResults")];
    const outcomes = await captureDay(
      [league("real", real), league("dummy", [answers("getLeagueInfo")])],
      CAPTURED_AT,
    );
    expect(outcomes.filter((outcome) => !outcome.ok)).toEqual([
      { method: "getStandings", ok: false, code: "ECONNRESET", message: dropped.message },
    ]);
    expect(existsSync(join(root, "real", "getDraftResults.json"))).toBe(true);
    expect(manifest("real").reads).toHaveLength(3);
    expect(existsSync(join(root, "dummy", "getLeagueInfo.json"))).toBe(true);
    expect(manifest("dummy").reads).toEqual([expect.objectContaining({ ok: true })]);
  });

  it("still throws a fault of our own rather than filing it as the provider's", async () => {
    const bug = fails("getLeagueInfo", new TypeError("cannot read properties of undefined"));
    await expect(captureDay([league("real", [bug])], CAPTURED_AT)).rejects.toThrow(TypeError);
  });
});
