import { describe, expect, it } from "vitest";
import { SPURS, VILLA, codeOf, fixture, spursVilla } from "./__fixtures__/spursVilla";
import { matchBlock } from "./brief";
import { checkReports } from "./checks";
import { deskDay } from "./desk";
import type { ReportPiece, ReportsDraft } from "./draft";

// A clean piece written for this test from the brief's own facts; the mutations below each break one rule.

const places = new Map([[6, 18], [7, 9]]);
const desks = deskDay({
  day: "2026-09-19",
  gameweek: 5,
  matches: [spursVilla({ holders: new Map([[codeOf("Buendía"), { team: "Notemail", fielded: true }]]), points: new Map([[codeOf("Buendía"), 7]]) })],
  season: [fixture],
  clubs: [SPURS, VILLA],
  standing: { attack: places, defence: places },
});
const blocks = new Map([[2645244, matchBlock(desks[0], true)]]);
const ctx = { desks, blocks, gameweek: 5, past: [] };

const CLEAN: ReportPiece = {
  standfirst: "Aston Villa won 3-2 at Tottenham Hotspur, who scored twice late on after trailing by three.",
  account:
    "Pedro Porro went off injured in the 19th minute. Johan Manzambi put Villa ahead four minutes into first-half added time, finishing from very close range after a pass from Boubacar Kamara. " +
    "Mohammed Kudus had a goal ruled out after a video review on the hour. Manzambi then set up Nicolas Jackson in the 67th minute and Emiliano Buendía scored from outside the box with 11 minutes left. " +
    "Conor Gallagher replied four minutes from time and Jan Paul van Hecke headed in a cross from Andy Robertson eight minutes into added time. " +
    "Tottenham Hotspur had 20 shots to 15, seven of them on target, and won 11 corners to one.",
  sections: [
    {
      head: "Manzambi scores and makes one",
      pitch:
        "Manzambi was involved in both of Villa's first two goals before he was taken off in the 72nd minute. He had four shots, two of them on target, " +
        "and his opener came from very close range after Kamara found him in the box. He then set up Jackson, who had six shots in all.",
      stake: "Nobody in the league holds Manzambi, and nobody holds Jackson either.",
    },
    {
      head: "Buendía from outside the box",
      pitch:
        "Buendía struck the third into the top corner from outside the box, from a pass by John McGinn. He made three chances in all and had three shots, " +
        "two of them on target, in a match where Villa scored three from six on target.",
      stake: "He was in the eleven Notemail picked, and it brought them 7 points.",
    },
    {
      head: "Robertson on the set pieces",
      pitch:
        "Robertson made four chances for Tottenham Hotspur, and his cross from a set piece brought the second goal, headed in by van Hecke. " +
        "Sávio also made four chances. Tottenham Hotspur made four clear chances and took two, and Aston Villa's clean sheet went four minutes from time.",
      stake: "Nobody in the league holds Robertson, van Hecke or Sávio.",
    },
  ],
};
const draft = (piece: Partial<ReportPiece> = {}, headline = "Villa hold on at Tottenham"): ReportsDraft => ({
  headline,
  matches: new Map([[2645244, { ...CLEAN, ...piece }]]),
});
const blocking = (d: ReportsDraft) => checkReports(d, ctx).filter((f) => f.severity !== "warn");
const checksOf = (d: ReportsDraft) => blocking(d).map((f) => `${f.severity}: ${f.check} (${f.evidence})`);

describe("checkReports", () => {
  it("passes a clean piece with nothing to send back", () => {
    expect(checksOf(draft())).toEqual([]);
  });

  it("refuses a percentage and a fantasy game's term outright", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Spurs had 64% of the ball.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: names a source/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], stake: "His xG was high." }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a fantasy game's term/)]));
  });

  it("refuses a scoreline the match never had, and sends back one written lower first", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} It finished 4-2.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a scoreline the match never had \(4-2\)/)]));
    expect(checksOf(draft({ standfirst: "Tottenham Hotspur lost 2-3 to Aston Villa, and are without a win." }))).toEqual(expect.arrayContaining([expect.stringMatching(/higher first/)]));
  });

  it("refuses a figure the facts do not give", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Villa had 17 shots.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a figure the facts do not give \(17\)/)]));
  });

  it("sends back a clock minute and a stock phrase", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("in the 19th minute", "on 19'") }))).toEqual(expect.arrayContaining([expect.stringMatching(/a minute as a clock/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} It was a pulsating encounter.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a phrase this paper does not print \(pulsating\)/)]));
  });

  it("lifts the sequence ban: came on is a fact this desk holds", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Archie Gray came on.` }))).toEqual([]);
  });

  it("keeps draft words out of the football and allows them in the stake", () => {
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} A haul.` }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/a draft word in the football \(haul\)/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], stake: "Nobody holds him, and it was a haul." }, ...CLEAN.sections.slice(1)] }))).toEqual([]);
  });

  it("sends back advice and a forecast of selection", () => {
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], stake: "Snap him up." }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/advice/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Archie Gray should start at Old Trafford.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/forecast of selection|a phrase this paper does not print \(should start\)/)]));
  });

  it("calls 3-2 from 3-0 no comeback", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} The comeback fell short.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a comeback that did not finish level or ahead/)]));
  });

  it("sends back goals told out of order, but not a scorer named earlier for something else", () => {
    expect(checksOf(draft({ account: "Pedro Porro went off injured in the 19th minute. Emiliano Buendía scored from outside the box. Johan Manzambi put Villa ahead. Nicolas Jackson scored. Conor Gallagher replied. Jan Paul van Hecke headed in." }))).toEqual(expect.arrayContaining([expect.stringMatching(/out of order|leaves out a scorer/)]));
  });

  it("sends back a piece that leaves out the injury", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("Pedro Porro went off injured in the 19th minute. ", "") }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out a goal, a red, a penalty, a VAR call or an injury/)]));
  });

  it("sends back a standfirst without both clubs or the score", () => {
    expect(checksOf(draft({ standfirst: "Villa held on in north London for their first win." }))).toEqual(expect.arrayContaining([expect.stringMatching(/names both clubs/), expect.stringMatching(/gives the score/)]));
  });

  it("sends back a record the facts do not give", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Villa are unbeaten.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a record the facts do not give/)]));
  });

  it("sends back the wrong number of sections and a head naming nobody", () => {
    expect(checksOf(draft({ sections: CLEAN.sections.slice(0, 2) }))).toEqual(expect.arrayContaining([expect.stringMatching(/3 sections, not 2/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], head: "A busy afternoon" }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/a head names a man or club/)]));
  });

  it("calls a man by his name, not his nationality", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} The Dutchman was booked.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/anything but his name/)]));
  });

  it("sends back a ground recalled from memory, and a shot the commentary never described", () => {
    expect(checksOf(draft({}, "Villa End The Wait On The Lane"))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(the Lane\)/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Buendía curved it in.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(curved\)/)]));
  });

  it("finds van Hecke at the start of a sentence, where he is Van Hecke", () => {
    const account = CLEAN.account.replace("and Jan Paul van Hecke headed in", ". Van Hecke headed in");
    expect(checksOf(draft({ account }))).toEqual([]);
  });

  it("refuses a starter called a substitute, and sends back a name without its accents", () => {
    const sections = [CLEAN.sections[0], { ...CLEAN.sections[1], head: "Buendía off the bench" }, CLEAN.sections[2]];
    expect(checksOf(draft({ sections }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a starter called a substitute/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Buendia was the pick.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/without its accents \(Buendia\)/)]));
  });

  it("lets the man who came on be the one who came on", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Kudus came on at half-time.` }))).toEqual([]);
  });

  it("lets an injury sentence name the man who came on after the starter who went off", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("Pedro Porro went off injured in the 19th minute.", "Pedro Porro went off injured in the 19th minute, Archie Gray coming on.") }))).toEqual([]);
  });

  it("needs the ruled-out goal told as ruled out, not only its man named", () => {
    const account = CLEAN.account.replace("Mohammed Kudus had a goal ruled out after a video review on the hour. ", "");
    expect(checksOf(draft({ account }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out .* \(ruled-out Mohammed Kudus\)/)]));
  });
});
