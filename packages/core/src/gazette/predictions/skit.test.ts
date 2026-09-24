import { describe, expect, it } from "vitest";
import { SAMPLE, ctx, draft } from "./__fixtures__/column";
import { applySkit, type SkitContext } from "./skit";

const PLAIN: [string, string][] = SAMPLE.map(([key, line]) => [key, line.replace("Borussia Teeth, by the skin of them.", "Borussia Teeth, narrowly.")]);

const skitCtx = (over: Partial<SkitContext> = {}): SkitContext => ({
  check: ctx(),
  doubts: ["Callum Reid"],
  wornShapes: [],
  wornTargets: [],
  lastLines: [],
  ...over,
});

const pun = { where: "im-bt", shape: "pun", target: "Borussia Teeth", before: "Borussia Teeth, narrowly.", after: "Borussia Teeth, by the skin of them." };

describe("applySkit", () => {
  it("lands a groaner on a gut tie's last line and records it", () => {
    const { draft: edited, applied, refused } = applySkit({ edits: [pun] }, draft(PLAIN), skitCtx());
    expect(refused).toEqual([]);
    expect(applied).toHaveLength(1);
    expect(edited.ties.get("im-bt")?.line.endsWith("Borussia Teeth, by the skin of them.")).toBe(true);
  });

  it("files the column untouched when nothing lands", () => {
    expect(applySkit({ edits: [] }, draft(PLAIN), skitCtx()).draft).toEqual(draft(PLAIN));
    expect(applySkit("not json", draft(PLAIN), skitCtx()).applied).toEqual([]);
  });

  it("refuses an edit that changes what the sentence says", () => {
    const tries = [
      { ...pun, after: "Borussia Teeth, as Haaland would say." },
      { ...pun, after: "Borussia Teeth, by three." },
      { ...pun, after: "Not Borussia Teeth, narrowly." },
      { ...pun, after: "Borussia Teeth, by the skin of them, which is the most you can say for anyone this week really." },
    ];
    for (const edit of tries) expect(applySkit({ edits: [edit] }, draft(PLAIN), skitCtx()).applied).toEqual([]);
  });

  it("keeps a gut call's reason, an injury and his career out of the jokes", () => {
    const reason = { where: "im-bt", shape: "picture", target: null, before: "On paper it's Inter Mittent.", after: "On paper it's Inter Mittent, like a bus timetable." };
    const injury = { where: "im-bt", shape: "shrug", target: null, before: "Their best man, Callum Reid, is a doubt with a hamstring.", after: "Their best man, Callum Reid, is a doubt, and so is his hamstring." };
    const career = { where: "intro", shape: "own-record", target: null, before: "I did this for the BBC for twenty-two years.", after: "I did this for the BBC for twenty-two years, and I was right." };
    for (const edit of [reason, injury, career]) expect(applySkit({ edits: [edit] }, draft(PLAIN), skitCtx()).refused).toHaveLength(1);
  });

  it("allows two edits in two sections and no more, and no worn shape, target or line", () => {
    const second = { where: "st-rr", shape: "consolation", target: null, before: "It won't matter.", after: "It won't matter, and that's about it." };
    const third = { where: "av-pa", shape: "picture", target: null, before: "Plymouth Argos win this.", after: "Plymouth Argos win this, like a Sunday roast." };
    expect(applySkit({ edits: [pun, second, third] }, draft(PLAIN), skitCtx()).applied.map((edit) => edit.where)).toEqual(["im-bt", "st-rr"]);
    expect(applySkit({ edits: [pun] }, draft(PLAIN), skitCtx({ wornShapes: ["pun"] })).applied).toEqual([]);
    expect(applySkit({ edits: [pun] }, draft(PLAIN), skitCtx({ wornTargets: ["Borussia Teeth"] })).applied).toEqual([]);
    expect(applySkit({ edits: [pun] }, draft(PLAIN), skitCtx({ lastLines: ["Real Sociable, by the skin of them."] })).applied).toEqual([]);
  });

  it("drops an edit that brings a banned word or a second question into the column", () => {
    const hype = { ...pun, shape: "picture", target: null, after: "Borussia Teeth, in a massive upset." };
    expect(applySkit({ edits: [hype] }, draft(PLAIN), skitCtx()).refused[0]).toContain("adds");
  });
});
