import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { everyDayCaptured } from "./snapshots";

// The backup capture's stand-down test, over a temp directory.

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "snapshots-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function day(name: string, reads: { ok: boolean }[]): string {
  const dir = join(root, name);
  mkdirSync(dir);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ reads }));
  return dir;
}

describe("everyDayCaptured", () => {
  it("is true when every directory recorded a read", async () => {
    const dirs = [day("real", [{ ok: true }, { ok: false }]), day("pool", [{ ok: true }])];
    expect(await everyDayCaptured(dirs)).toBe(true);
  });

  it("is false when one directory recorded nothing", async () => {
    const dirs = [day("real", [{ ok: true }]), day("pool", [{ ok: false }])];
    expect(await everyDayCaptured(dirs)).toBe(false);
  });

  it("is false when a directory was never written", async () => {
    expect(await everyDayCaptured([day("real", [{ ok: true }]), join(root, "missing")])).toBe(false);
  });
});
