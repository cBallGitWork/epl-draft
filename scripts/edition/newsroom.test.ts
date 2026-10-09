import { describe, expect, it } from "vitest";
import { __escapeControlsInStrings as escape, __objectIn as objectIn, storyOfColumn } from "./newsroom";

describe("finding the JSON in a reply", () => {
  it("drops a sentence and a fence around it, and leaves a reply with no object to fail", () => {
    expect(JSON.parse(objectIn('Looking for groaners.\n```json\n{"edits":[]}\n```'))).toEqual({ edits: [] });
    expect(objectIn('{"a":{"b":1}}')).toBe('{"a":{"b":1}}');
    expect(() => JSON.parse(objectIn("No edits this week."))).toThrow();
  });
});

describe("repairing a column's JSON", () => {
  it("rescues a body whose paragraphs are real newlines", () => {
    // The failure verbatim, 2 Sep 2026: the house style asks for paragraphs
    // separated by blank lines and the model obliged inside the quotes, where
    // the spec requires \n. Two of ten columns died on it.
    const broken = '{"headline":"A pun","body":"One paragraph.\n\nAnd another."}';
    expect(() => JSON.parse(broken)).toThrow();
    const parsed = JSON.parse(escape(broken));
    expect(parsed.body).toBe("One paragraph.\n\nAnd another.");
    expect(parsed.headline).toBe("A pun");
  });

  it("leaves the newlines BETWEEN fields alone", () => {
    const pretty = '{\n  "headline": "A pun",\n  "deck": "In plain words"\n}';
    expect(JSON.parse(escape(pretty))).toEqual({ headline: "A pun", deck: "In plain words" });
  });

  it("does not double-escape a newline the model escaped correctly", () => {
    const good = '{"body":"One.\\n\\nTwo."}';
    expect(JSON.parse(escape(good)).body).toBe("One.\n\nTwo.");
  });

  it("survives an escaped quote inside a string", () => {
    const quoted = '{"body":"He said \\"no\\" and left.\nThen returned."}';
    expect(JSON.parse(escape(quoted)).body).toBe('He said "no" and left.\nThen returned.');
  });

  it("still refuses a column whose braces are wrong", () => {
    // Deliberately not a tolerant parser: a genuinely malformed column is a
    // failure, and a second exception is the honest outcome.
    expect(() => JSON.parse(escape('{"headline":"A pun"'))).toThrow();
  });
});

describe("stamping a column into a story", () => {
  const meta = {
    slug: "gw6-predicted-xi", kind: "predicted-xi" as const, leagueId: "L", period: 6, gameweek: 6,
    filedAt: "2026-10-09T17:25:00.000Z", expiresAt: "2026-10-10T11:30:00Z", edition: "The Form Guide", byline: "The Line-Ups",
    subject: "predicted-xi:gw6", face: null,
  };
  const column = { headline: "Predicted Line-Ups: Gameweek 6", deck: "D", body: "B" };

  it("carries the desk's lead onto the story, and none where the desk gave none", () => {
    expect(storyOfColumn(column, { ...meta, leadsUntil: "2026-10-10T11:15:00.000Z" }).story.leadsUntil).toBe("2026-10-10T11:15:00.000Z");
    expect(storyOfColumn(column, meta).story).not.toHaveProperty("leadsUntil");
  });
});
