import { describe, expect, it } from "vitest";
import { DRAFT_FRAMES, DRAFT_NEVER, REPORT_AMERICAN, REPORT_FPL, SHEETS_AMERICAN, banned } from "@epl/core";
import { DRAFT_JUDGE_VOICE, DRAFT_VOICE } from "./draft";

// A prompt's own words become the column's tics, so the voice never uses a word its checks send back.
const prose = (voice: string) => voice.split("\n").filter((line) => !/^(?:- (?:Never|You never name)|FOOTBALL MANAGER'S REGISTER)/.test(line)).join("\n");
const never = [...DRAFT_NEVER, ...REPORT_FPL, ...REPORT_AMERICAN, ...SHEETS_AMERICAN];

describe("the draft report's voices", () => {
  it("use none of the words they ban, outside the lists that ban them", () => {
    expect(banned(prose(DRAFT_VOICE), never)).toEqual([]);
    expect(banned(DRAFT_JUDGE_VOICE, never)).toEqual([]);
  });

  it("let Football Manager's frames back in, and carry no example sentence", () => {
    expect(banned(DRAFT_FRAMES.join(". "), DRAFT_NEVER)).toEqual([]);
    expect(prose(DRAFT_VOICE)).not.toMatch(/["“][A-Z][^"”]{12,}["”]/u);
  });
});
