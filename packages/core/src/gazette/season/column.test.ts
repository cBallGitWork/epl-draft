import { describe, expect, it } from "vitest";
import type { Fault } from "../predictions/checks";
import { seasonCalls, type SeasonCalls } from "./calls";
import { lineKey } from "./checks";
import { assembleSeason, mergeSeason, readSeasonDraft } from "./column";
import { PLAYED, SQUADS } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, []) as SeasonCalls;
const raw = {
  deck: "Lawro ranks Albion first.",
  opening: "Opening!",
  // Out of order, one side twice and one the league does not have: the desk's order and sides win.
  table: [
    { teamId: "r", line: "Rovers line." },
    { teamId: "a", line: "Albion line — first." },
    { teamId: "a", line: "Albion again." },
    { teamId: "zz", line: "Nobody." },
    { teamId: "u", line: "United line." },
  ],
};
const hard = (section: string): Fault => ({ section, check: "x", severity: "hard", evidence: "" });
const back = (section: string): Fault => ({ section, check: "x", severity: "send-back", evidence: "" });

describe("readSeasonDraft", () => {
  it("reads the column on the desk's own sides, pencilled, and refuses what is no column", () => {
    const draft = readSeasonDraft(raw, calls);
    expect(draft?.opening).toBe("Opening.");
    expect([...(draft?.table ?? [])]).toEqual([["r", "Rovers line."], ["a", "Albion line, first."], ["u", "United line."]]);
    expect(readSeasonDraft({ deck: "x" }, calls)).toBeNull();
  });
});

describe("mergeSeason", () => {
  it("takes each section from the latest attempt without a hard fault in it, and leaves one hard in both empty", () => {
    const first = readSeasonDraft(raw, calls);
    const second = readSeasonDraft({ ...raw, opening: "Second opening.", table: [{ teamId: "a", line: "Second Albion." }] }, calls);
    if (first === null || second === null) throw new Error("no draft");
    const merged = mergeSeason([{ draft: first, faults: [hard("deck")] }, { draft: second, faults: [hard("deck"), hard(lineKey("u"))] }], calls);
    expect(merged.opening).toBe("Second opening.");
    expect(merged.deck).toBe("");
    expect(merged.table.get("a")).toBe("Second Albion.");
    expect(merged.table.get("u")).toBe("United line.");
    expect(merged.table.get("c")).toBe("");
  });

  it("keeps the earlier telling of a section the rewrite made worse", () => {
    const first = readSeasonDraft(raw, calls);
    const second = readSeasonDraft({ ...raw, opening: "Worse opening." }, calls);
    if (first === null || second === null) throw new Error("no draft");
    const merged = mergeSeason([{ draft: first, faults: [back("opening")] }, { draft: second, faults: [back("opening"), back("opening")] }], calls);
    expect(merged.opening).toBe("Opening.");
  });
});

describe("assembleSeason", () => {
  it("files the desk's headline, his opening, and the rankings in the desk's order with every side on them", () => {
    const draft = readSeasonDraft(raw, calls);
    if (draft === null) throw new Error("no draft");
    const column = assembleSeason(draft, calls, "Lawro's Power Rankings");
    expect(column.headline).toBe("Lawro's Power Rankings");
    expect(column.body).toBe("Opening.");
    expect(column.ranks).toEqual([
      { teamId: "a", line: "Albion line, first." },
      { teamId: "u", line: "United line." },
      { teamId: "c", line: "" },
      { teamId: "r", line: "Rovers line." },
    ]);
    expect(column.moves).toBeUndefined();
  });

  it("files the rankings in the printed order with the editor's moves on the record", () => {
    const moved = seasonCalls(PLAYED, SQUADS, [{ teamId: "r", place: 3, by: "Craig", on: "2026-10-05", said: "put Rovers 3rd" }]) as SeasonCalls;
    const draft = readSeasonDraft(raw, moved);
    if (draft === null) throw new Error("no draft");
    const column = assembleSeason(draft, moved, "Lawro's Power Rankings");
    expect((column.ranks as { teamId: string }[]).map((rank) => rank.teamId)).toEqual(["a", "u", "r", "c"]);
    expect(column.moves).toEqual([{ teamId: "r", place: 3, by: "Craig", on: "2026-10-05", said: "put Rovers 3rd", from: 4 }]);
  });
});
