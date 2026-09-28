import { describe, expect, it } from "vitest";
import { REPORT_ADVICE, REPORT_AMERICAN, REPORT_FPL, REPORT_NEVER, SHEETS_AMERICAN, banned } from "@epl/core";
import { FAN_VOICE, REPORTS_VOICE } from "./reports";

// A prompt's own words become the column's tics, so the voice never uses a word its checks send back.
const prose = (voice: string) => voice.split("\n").filter((line) => !/^- (?:Never|Draft words|At most|You never name)/.test(line)).join("\n");
const never = [...REPORT_NEVER, ...REPORT_FPL, ...REPORT_ADVICE, ...REPORT_AMERICAN, ...SHEETS_AMERICAN];

describe("the match report's voices", () => {
  it("use none of the words they ban, outside the lists that ban them", () => {
    expect(banned(prose(REPORTS_VOICE), never)).toEqual([]);
    expect(banned(FAN_VOICE, never)).toEqual([]);
  });

  it("carry no example sentence in quotation marks", () => {
    expect(prose(REPORTS_VOICE)).not.toMatch(/["“][A-Z][^"”]{12,}["”]/u);
  });
});
