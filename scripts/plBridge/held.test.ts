import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { heldBridge } from "./held";

// The map `npm run pl-bridge` adds to, over a temp directory.

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pl-bridge-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("heldBridge", () => {
  it("starts empty when there is no file", async () => {
    expect(await heldBridge(join(dir, "premierleague.json"), "2026/27")).toEqual({ season: "2026/27", players: {} });
  });

  it("keeps this season's map and starts another season's afresh", async () => {
    const path = join(dir, "premierleague.json");
    writeFileSync(path, JSON.stringify({ season: "2026/27", players: { "1": "p100" } }));
    expect((await heldBridge(path, "2026/27")).players).toEqual({ "1": "p100" });
    expect((await heldBridge(path, "2027/28")).players).toEqual({});
  });

  it("refuses a file that will not parse rather than writing an empty map over it", async () => {
    const path = join(dir, "premierleague.json");
    writeFileSync(path, '{"season": "2026/27", "players": {');
    await expect(heldBridge(path, "2026/27")).rejects.toThrow();
  });
});
