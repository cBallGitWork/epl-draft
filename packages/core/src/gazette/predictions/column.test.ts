import { describe, expect, it } from "vitest";
import { normalizeStory } from "../story";
import { CALLS, SAMPLE, draft } from "./__fixtures__/column";
import type { Fault } from "./checks";
import { assembleLawro, featured, mergeAttempts, readDraft } from "./column";
import type { SquadMan } from "./sides";

const hard = (section: string): Fault => ({ section, check: "line-up", severity: "hard", evidence: "benched" });

describe("readDraft", () => {
  it("keys every tie the desk's way round, pencils it, and drops a tie it never set", () => {
    const read = readDraft(
      {
        deck: "A deck.",
        body: "So, two from five!",
        ties: [
          { homeTeamId: "bn", awayTeamId: "rs", backs: "rs", line: "Swapped round — still ours." },
          { homeTeamId: "zz", awayTeamId: "yy", backs: "zz", line: "A tie nobody set." },
        ],
      },
      CALLS,
    );
    expect(read?.intro).toBe("Two from five.");
    expect(read?.ties.get("rs-bn")).toEqual({ line: "Swapped round, still ours.", backs: "rs" });
    expect(read?.ties.size).toBe(1);
    expect(readDraft({ body: "no ties" }, CALLS)).toBeNull();
  });
});

describe("mergeAttempts", () => {
  it("takes each section from the latest clean attempt, and leaves a section hard in both empty", () => {
    const first = draft();
    const second = draft(SAMPLE.map(([key, line]) => [key, `${line} Again.`]));
    const merged = mergeAttempts(
      [
        { draft: first, faults: [hard("st-rr")] },
        { draft: second, faults: [hard("rs-bn"), hard("st-rr")] },
      ],
      CALLS,
    );
    expect(merged.ties.get("im-bt")?.line.endsWith("Again.")).toBe(true);
    expect(merged.ties.get("rs-bn")?.line).toBe(SAMPLE[0][1]);
    expect(merged.ties.get("st-rr")?.line).toBe("");
  });
});

describe("assembleLawro", () => {
  it("files the desk's calls and scores beside his words, and keeps a call whose prose failed", () => {
    const words = draft();
    (words.ties as Map<string, { line: string; backs: string | null }>).set("st-rr", { line: "", backs: "bn" });
    const column = assembleLawro({ draft: words, calls: CALLS, headline: "Lawro's Predictions: GW11", men: new Map(), record: { right: 7, called: 15 }, skit: [], threads: [] });
    // The cargo folds into extras as `storyOfColumn` folds it.
    const story = normalizeStory({ ...column, extras: { record: column.record, skit: column.skit }, slug: "gw11-predictions", kind: "predictions", leagueId: "l", period: 11, gameweek: 11, filedAt: "2026-10-22T17:30:00.000Z" });
    const ties = story?.ties ?? [];
    expect(ties.find((tie) => tie.homeTeamId === "im")).toMatchObject({ callsTeamId: "bt", instinct: "doubt", score: { home: 50, away: 40 } });
    // The prose failed the editor twice; the call and the score still print and still get marked.
    expect(ties.find((tie) => tie.homeTeamId === "st")).toMatchObject({ line: "", callsTeamId: "rr" });
    expect(story?.extras?.record).toEqual({ right: 7, called: 15 });
    expect(story?.extras?.skit).toBeUndefined();
  });

  it("files the desk's headline, and beside each tie the man its line names first", () => {
    const men = new Map([["rs-bn", [man("Kettle"), man("Oduya"), man("Pym")]]]);
    const column = assembleLawro({ draft: draft(), calls: CALLS, headline: "Lawro's Predictions: GW11", men, record: null, skit: [], threads: [] });
    const story = normalizeStory({ ...column, slug: "gw11-predictions", kind: "predictions", leagueId: "l", period: 11, gameweek: 11, filedAt: "2026-10-22T17:30:00.000Z" });
    expect(story?.headline).toBe("Lawro's Predictions: GW11");
    expect(story?.ties?.find((tie) => tie.homeTeamId === "rs")?.face).toEqual(man("Oduya").face);
    // A tie whose line names none of its men prints no picture rather than a stranger's.
    expect(story?.ties?.find((tie) => tie.homeTeamId === "im")).not.toHaveProperty("face");
    expect(column).not.toHaveProperty("record");
  });
});

describe("featured", () => {
  it("takes the first man named whole, never a name inside a longer word", () => {
    expect(featured("Pymble scored. Kettle and Pym both start.", [man("Pym"), man("Kettle")])?.name).toBe("Kettle");
    expect(featured("B.Fernandes has Leeds.", [man("Fernandes"), man("B.Fernandes")])?.name).toBe("B.Fernandes");
    expect(featured("Nobody named.", [man("Pym")])).toBeNull();
  });
});

function man(name: string): SquadMan {
  const fit = { state: "fit", label: "", out: false, chance: null, news: "" } as const;
  return { name, club: "", positions: ["M"], horizon: null, availability: fit, fixtures: [], ease: null, liverpool: false, face: { code: name.length, name, clubId: 1, position: null } };
}
