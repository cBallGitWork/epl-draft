import { describe, expect, it } from "vitest";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { draftMan } from "./__fixtures__/draftMan";
import { contextOf } from "./__fixtures__/context";
import { draftBlocks } from "./brief";
import { checkDraft } from "./checks";
import type { DraftSide } from "./types";

const context = (home: DraftSide, away: DraftSide) => contextOf(home, away, { places: { home: { rank: 2, won: 1, drawn: 0, lost: 0, run: "W" }, away: null } });
const contexts = [
  context(draftSide("123", 38, eleven("h", { 9: draftMan("Haaland", "F", 6, 90, 0, { code: 223094, clubCode: 43, goals: 1 }) })), draftSide("test2", 37, eleven("a"))),
  context(draftSide("test3", 33, eleven("c", { 1: draftMan("Vuskovic", "D", 6, 90) })), draftSide("test4", 28, eleven("d"))),
];
const blocks = draftBlocks("gameweek", contexts);
const clean = "Haaland got 6 with a goal, and 123 beat test2 by the one point that separated the sides at the end of the gameweek. The rest of the eleven blanked. It left 123 above test2 and two points clear of their nearest rival in the table. Nobody on either bench came into it, and neither side lost a man before the hour.";
const writing = (one: string, two = clean.replace(/Haaland/gu, "Vuskovic").replace(/123/gu, "test3").replace(/test2/gu, "test4")) => ({
  headlines: [], meanings: {}, headlineStory: "",
  matchups: new Map([[1, { paragraphs: [one] }], [2, { paragraphs: [two] }]]),
});
const checks = (one: string) => checkDraft(writing(one), contexts, blocks).filter((f) => f.section.startsWith("1:")).map((f) => `${f.severity}: ${f.check} (${f.evidence})`);

describe("checkDraft", () => {
  it("passes writing drawn from its own block", () => {
    expect(checks(clean)).toEqual([]);
  });

  it("refuses another match-up's man, a figure or a score the brief does not give, and a quotation", () => {
    expect(checks(clean.replace("Haaland", "Vuskovic"))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a man from another match-up \(Vuskovic\)/)]));
    expect(checks(`${clean} It was 41-30 at one stage, after 17 minutes.`)).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a score the brief does not give \(41-30\)/), expect.stringMatching(/^hard: a figure the brief does not give \(17\)/)]));
    expect(checks(`${clean} "We won," said nobody.`)).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a quotation mark/), expect.stringMatching(/send-back: a phrase this paper does not print \(said\)/)]));
  });

  it("reads a side's eleven as a side, not as the figure 11", () => {
    expect(checks(`${clean} Every man in test2's eleven started, and the eleven's form held.`).filter((f) => f.includes("figure"))).toEqual([]);
    expect(checks(`${clean} It finished with eleven points between them.`)).toEqual(expect.arrayContaining([expect.stringMatching(/figure the brief does not give \(11\)/)]));
  });

  it("reads a man's name as a name, not a banned word, and lets a gap read off a printed score stand", () => {
    const gray = contextOf(draftSide("123", 38, eleven("h", { 5: draftMan("Gray", "M", 2, 90, 0, { club: "Spurs" }) })), draftSide("test2", 33, eleven("a")));
    const said = (text: string) => checkDraft({ ...writing(text), matchups: new Map([[1, { paragraphs: [text] }]]) }, [gray], draftBlocks("gameweek", [gray])).map((f) => f.check);
    const text = "Gray kept going for 123 to the end, and they won by five, the gap the page prints above.";
    expect(said(text)).not.toContain("American, not British");
    expect(said(text).filter((c) => c.includes("figure"))).toEqual([]);
  });

  it("sends back a still-to-play man told as a manager's choice", () => {
    expect(checks(`${clean} test2 keep back Trafford for Sunday.`)).toEqual(expect.arrayContaining([expect.stringMatching(/keep back/)]));
  });

  it("sends back a reason a man did not play, which the brief never gives", () => {
    expect(checks(`${clean} The absent Millar cost test2.`)).toEqual(expect.arrayContaining([expect.stringMatching(/absent/)]));
  });

  it("sends back a manager's feeling, a held man and American spelling, but lets an FM frame through", () => {
    expect(checks(`${clean} The manager felt furious.`)).toEqual(expect.arrayContaining([expect.stringMatching(/a named person's feeling/)]));
    expect(checks(`${clean} test2 held him.`)).toEqual(expect.arrayContaining([expect.stringMatching(/held him/)]));
    expect(checks(`${clean} The pressure is on test2 in the boardroom.`)).toEqual([]);
  });
});
