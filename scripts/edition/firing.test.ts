import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Assignment } from "@epl/core";
import { fire, type Run } from "./firing";
import { readLedger, readPaperStories, saveFiling, type Filing } from "./persist";

const NOW = "2026-10-10T12:00:00.000Z";
const LEAGUE = "a-test-league";

let root = "";
afterEach(() => {
  if (root !== "") rmSync(root, { recursive: true, force: true });
  root = "";
});

function assignment(key: string): Assignment {
  return { kind: "news", key, slug: key };
}

function filing(key: string): Filing {
  return {
    story: {
      slug: key, kind: "news", leagueId: LEAGUE, period: 1, gameweek: 6, filedAt: NOW, expiresAt: null,
      edition: "", byline: "", headline: `Headline ${key}`, deck: "", body: "", subjects: [key], image: null, face: null,
    },
    spentKeys: [key],
    threads: [],
  };
}

function run(overrides: Partial<Run>): Run {
  return {
    cap: 10,
    commission: async (each) => filing(each.key),
    save: (_filings, ledger) => ledger,
    ...overrides,
  };
}

describe("a firing's loop", () => {
  it("a firing that fails after two stories has already saved both", async () => {
    root = mkdtempSync(join(tmpdir(), "firing-"));
    const firing = fire(["a", "b", "c"].map(assignment), {}, run({
      commission: async (each) => {
        if (each.key === "c") throw new Error("the job timed out");
        return filing(each.key);
      },
      save: (filings, ledger) => saveFiling([], filings, ledger, NOW, root),
    }));

    await expect(firing).rejects.toThrow("the job timed out");
    expect(readPaperStories(root).map((each) => each.slug).sort()).toEqual(["a", "b"]);
    expect(readLedger(root)[LEAGUE]?.covered).toEqual(["a", "b"]);
  });

  it("hands each save the ledger the last one wrote", async () => {
    const seen: string[][] = [];
    await fire(["a", "b"].map(assignment), {}, run({
      save: (filings, ledger) => {
        seen.push(ledger[LEAGUE]?.covered ?? []);
        const newest = filings[filings.length - 1];
        return { [LEAGUE]: { covered: [...(ledger[LEAGUE]?.covered ?? []), ...newest.spentKeys], threads: [] } };
      },
    }));
    expect(seen).toEqual([[], ["a"]]);
  });

  it("saves nothing for a refusal or a failed call, and counts the failure", async () => {
    const saved: number[] = [];
    const outcome = await fire(["a", "b", "c"].map(assignment), {}, run({
      commission: async (each) => (each.key === "a" ? null : each.key === "b" ? "failed" : filing(each.key)),
      save: (filings, ledger) => (saved.push(filings.length), ledger),
    }));
    expect(outcome.failed).toBe(1);
    expect(outcome.filings.map((each) => each.story.slug)).toEqual(["c"]);
    expect(saved).toEqual([1]);
  });
});
