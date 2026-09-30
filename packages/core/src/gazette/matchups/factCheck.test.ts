import { describe, expect, it } from "vitest";
import { benchTurned } from "./__fixtures__/gw5";
import { matchupBlock } from "./block";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { applyFactFixes, knownFixes, readFactFixes } from "./factCheck";

const ctx = benchTurned();
const blocks = [matchupBlock(ctx, "gameweek", 1)];
const pieces = new Map([[1, { paragraphs: ["Two reserves turned it for test3.", "Vuskovic and Janelt came in for test4. That seven to two settled it.", "test3 stay top."] }]]);
const fix = (quote: string, correction: string) => applyFactFixes(pieces, [{ matchup: 1, quote, correction }], [ctx], blocks);

describe("the draft report's fact check", () => {
  it("reads the checker's fixes, dropping any without a quote or a match-up", () => {
    expect(readFactFixes({ fixes: [{ number: 1, quote: " x ", correction: "y" }, { number: "a", quote: "z" }, { number: 2 }] })).toEqual([{ matchup: 1, quote: "x", correction: "y" }]);
  });

  it("puts a sound correction in place of its quote", () => {
    expect(fix("came in for test4", "came in for test3").pieces.get(1)?.paragraphs[1]).toBe("Vuskovic and Janelt came in for test3. That seven to two settled it.");
  });

  it("cuts the claim when the correction has a figure the brief does not give, or there is none", () => {
    expect(fix("That seven to two settled it.", "That 12 to two settled it.").pieces.get(1)?.paragraphs[1]).toBe("Vuskovic and Janelt came in for test4.");
    expect(fix("Two reserves turned it for test3.", "").pieces.get(1)?.paragraphs).toEqual(["Vuskovic and Janelt came in for test4. That seven to two settled it.", "test3 stay top."]);
  });

  it("leaves the writing alone for a quote it cannot find", () => {
    expect(fix("nothing like this", "anything").made).toBe(0);
  });

  it("puts a keeper's position right and cuts a man put on a day he did not play, without a model", () => {
    const wrong = new Map([[1, { paragraphs: ["Everton defender Jordan Pickford kept a clean sheet. Friday belonged to Pickford."] }]]);
    const keeper = contextOf(draftSide("A", 10, eleven("h", { 0: draftMan("Pickford", "G", 7, 90, 0, { club: "Everton", cleanSheets: 1 }) })), draftSide("B", 5, eleven("a")));
    expect(knownFixes(wrong, [keeper])).toEqual([
      { matchup: 1, quote: "defender Jordan Pickford", correction: "goalkeeper Jordan Pickford" },
      { matchup: 1, quote: "Friday belonged to Pickford.", correction: "" },
    ]);
  });
});
