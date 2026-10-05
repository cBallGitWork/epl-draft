import { describe, expect, it } from "vitest";
import type { Fault } from "../predictions/checks";
import { seasonCalls, type SeasonCalls } from "./calls";
import { lineKey } from "./checks";
import { assembleSeason, mergeSeason, readSeasonDraft } from "./column";
import { CUT, PLAYED, SQUADS } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, CUT) as SeasonCalls;
const raw = {
  deck: "Lawro picks Albion.",
  opening: "Opening.",
  title: "Title.",
  playoffs: "Playoffs.",
  spoon: "Spoon.",
  bold: "Bold!",
  // Out of order, one side twice and one the league does not have: the desk's order and sides win.
  table: [
    { teamId: "r", line: "Rovers line." },
    { teamId: "a", line: "Albion line — first." },
    { teamId: "a", line: "Albion again." },
    { teamId: "zz", line: "Nobody." },
    { teamId: "u", line: "United line." },
  ],
};

describe("readSeasonDraft", () => {
  it("reads the column on the desk's own sides, pencilled, and refuses what is no column", () => {
    const draft = readSeasonDraft(raw, calls);
    expect(draft?.bold).toBe("Bold.");
    expect([...(draft?.table ?? [])]).toEqual([["r", "Rovers line."], ["a", "Albion line, first."], ["u", "United line."]]);
    expect(readSeasonDraft({ deck: "x" }, calls)).toBeNull();
  });
});

describe("mergeSeason", () => {
  it("takes each section from the latest attempt without a hard fault in it, and leaves one hard in both empty", () => {
    const first = readSeasonDraft(raw, calls);
    const second = readSeasonDraft({ ...raw, title: "Second title.", table: [{ teamId: "a", line: "Second Albion." }] }, calls);
    if (first === null || second === null) throw new Error("no draft");
    const hard = (section: string): Fault => ({ section, check: "x", severity: "hard", evidence: "" });
    const merged = mergeSeason([{ draft: first, faults: [hard("bold")] }, { draft: second, faults: [hard("bold"), hard(lineKey("u"))] }], calls);
    expect(merged.title).toBe("Second title.");
    expect(merged.bold).toBe("");
    expect(merged.table.get("a")).toBe("Second Albion.");
    expect(merged.table.get("u")).toBe("United line.");
    expect(merged.table.get("c")).toBe("");
  });

  it("keeps the earlier telling of a section the rewrite made worse", () => {
    const first = readSeasonDraft(raw, calls);
    const second = readSeasonDraft({ ...raw, spoon: "Worse spoon." }, calls);
    if (first === null || second === null) throw new Error("no draft");
    const back = (section: string): Fault => ({ section, check: "x", severity: "send-back", evidence: "" });
    const merged = mergeSeason([{ draft: first, faults: [back("spoon")] }, { draft: second, faults: [back("spoon"), back("spoon"), back("title")] }], calls);
    expect(merged.spoon).toBe("Spoon.");
    expect(merged.title).toBe("Title.");
  });
});

describe("assembleSeason", () => {
  it("files the desk's headline, his paragraphs in order, and the table in the desk's order with every side on it", () => {
    const draft = readSeasonDraft(raw, calls);
    if (draft === null) throw new Error("no draft");
    const column = assembleSeason({ ...draft, spoon: "" }, calls, "Lawro's Season Predictions");
    expect(column.headline).toBe("Lawro's Season Predictions");
    expect(column.body).toBe("Opening.\n\nTitle.\n\nPlayoffs.\n\nBold.");
    expect(column.ranks).toEqual([
      { teamId: "a", line: "Albion line, first." },
      { teamId: "u", line: "United line." },
      { teamId: "c", line: "" },
      { teamId: "r", line: "Rovers line." },
    ]);
  });
});
