import { describe, expect, it } from "vitest";
import { SPURS, VILLA, codeOf, fixture, spursVilla } from "./__fixtures__/spursVilla";
import { matchBlock } from "./brief";
import { checkReports } from "./checks";
import { deskDay } from "./desk";
import type { ReportPiece, ReportsDraft } from "./draft";
import { PALMER, SAKA, deskOf, matchInput, moment, reportMan } from "./__fixtures__/built";
import type { ReportMatchInput } from "./types";

// A clean piece written for this test from the brief's own facts; the mutations below each break one rule.

const places = new Map([[6, 18], [7, 9]]);
const desks = deskDay({
  day: "2026-09-19",
  gameweek: 5,
  matches: [spursVilla({ holders: new Map([[codeOf("Buendía"), { team: "Notemail", fielded: true, round: null, h2h: null }]]), points: new Map([[codeOf("Buendía"), 7]]) })],
  season: [fixture],
  clubs: [SPURS, VILLA],
  standing: { attack: places, defence: places },
  // The clean piece below is written to this length; the config's budget moves as the paper's does.
}).map((d) => ({ ...d, budget: { ...d.budget, account: [90, 130] as const } }));
const blocks = new Map([[2645244, matchBlock(desks[0])]]);
const ctx = { desks, blocks, gameweek: 5, past: [] };

const CLEAN: ReportPiece = {
  standfirst: "Aston Villa won 3-2 at Tottenham Hotspur for their first win of the season, leaving Spurs in the bottom three.",
  account:
    "Aston Villa were 3-0 up with 11 minutes left and still had to hang on. Pedro Porro went off injured after 19 minutes, Archie Gray coming on. " +
    "Johan Manzambi put Villa ahead just before the interval, set up by Boubacar Kamara. Mohammed Kudus had a goal ruled out after a video review on the hour. " +
    "Nicolas Jackson doubled the lead from a Manzambi pass, and Emiliano Buendía struck the third from outside the box into the top corner, supplied by John McGinn. " +
    "Conor Gallagher replied four minutes from time from a Kudus ball, and Jan Paul van Hecke headed in a cross from Andy Robertson deep into added time.",
  sections: [
    {
      head: "Manzambi marks his start",
      pitch: "Manzambi was part of both of Villa's opening goals in his first league start of the season, trying his luck four times, twice on target, before he was taken off.",
      stake: "A free agent, so a goal and an assist went unclaimed.",
    },
    {
      head: "Buendía finds the corner",
      pitch: "Buendía played the whole match and had three attempts, two of them on target, the last of them the third goal. He also teed up three for team-mates.",
      stake: "Seven points for Notemail, whose man he is.",
    },
    {
      head: "Robertson supplies the header",
      pitch: "Robertson created four chances for Tottenham Hotspur, and his delivery from a set piece brought their second goal in the eighth minute of added time.",
      stake: "Nobody has him.",
    },
  ],
};
const draft = (piece: Partial<ReportPiece> = {}, headline = "Villa hold on at Tottenham"): ReportsDraft => ({
  headline,
  headlines: [headline],
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

  it("reads a team called 123 as a name, and the 80th minute as a minute, not a clock or a place in the table", () => {
    const account = `${CLEAN.account.replace("Aston Villa were 3-0 up", "From the 80th minute Aston Villa, 3-0 up,")}`;
    const stake = "Seven points for 123's side.";
    const faults = checksOf(draft({ account, sections: [CLEAN.sections[0], { ...CLEAN.sections[1], stake }, CLEAN.sections[2]] }));
    expect(faults.filter((f) => /clock|table belongs/.test(f))).toEqual([]);
  });

  it("sends back a clock minute and a stock phrase", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("after 19 minutes", "on 19'") }))).toEqual(expect.arrayContaining([expect.stringMatching(/a minute as a clock/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} It was a pulsating encounter.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a phrase this paper does not print \(pulsating\)/)]));
  });

  it("lifts the sequence ban: came on is a fact this desk holds", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Archie Gray came on.` }))).toEqual([]);
  });

  it("keeps draft words out of the football and allows them in the stake", () => {
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} A haul.` }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/a draft word in the football \(haul\)/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], stake: "A free agent, and it was a haul." }, ...CLEAN.sections.slice(1)] }))).toEqual([]);
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
    expect(checksOf(draft({ account: CLEAN.account.replace("Pedro Porro went off injured after 19 minutes, Archie Gray coming on. ", "") }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out a goal, a red, a penalty, a VAR call or an injury/)]));
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
    expect(checksOf(draft({ account: `${CLEAN.account} Villa ended the wait at the Lane.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(the Lane\)/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Buendía curved it in.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(curved\)/)]));
  });

  it("finds van Hecke at the start of a sentence, where he is Van Hecke", () => {
    const account = CLEAN.account.replace("and Jan Paul van Hecke headed in a cross", "and then Van Hecke, Jan Paul van Hecke, headed in a cross");
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
    expect(checksOf(draft({ account: CLEAN.account }))).toEqual([]);
  });

  it("needs the ruled-out goal told as ruled out, not only its man named", () => {
    const account = CLEAN.account.replace("Mohammed Kudus had a goal ruled out after a video review on the hour. ", "");
    expect(checksOf(draft({ account }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out .* \(ruled-out Mohammed Kudus\)/)]));
  });

  it("sends back a fixture in a stake, and a stake about another man", () => {
    const stakes = (stake: string) => [CLEAN.sections[0], { ...CLEAN.sections[1], stake }, CLEAN.sections[2]];
    expect(checksOf(draft({ sections: stakes("Seven points for Notemail, and Villa host Brentford next.") }))).toEqual(expect.arrayContaining([expect.stringMatching(/a fixture in a stake/)]));
    expect(checksOf(draft({ sections: stakes("Seven points for Notemail, as for Jackson.") }))).toEqual(expect.arrayContaining([expect.stringMatching(/a stake names only its own man/)]));
  });

  it("never calls a club a stranger: a stake may name another match's club as the next opponent", () => {
    const other = { ...desks[0], match: { ...desks[0].match, fixture: { ...fixture, code: 99 }, home: { ...desks[0].match.home, name: "Arsenal", shorts: [] }, men: [] } };
    const faults = checkReports(draft({ sections: [CLEAN.sections[0], { ...CLEAN.sections[1], stake: "He was in the eleven Notemail picked, 7 points, and Arsenal lost too." }, CLEAN.sections[2]] }), { ...ctx, desks: [desks[0], other] });
    expect(faults.filter((f) => f.section.startsWith("2645244") && f.check === "a man from another match")).toEqual([]);
  });

  it("keeps the table in the standfirst, a section off the account's ground, and bookings out of the account", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Spurs stay in the bottom three.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/the table belongs to the standfirst/)]));
    const retold = [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} Manzambi put Villa ahead just before the interval.` }, ...CLEAN.sections.slice(1)];
    expect(checksOf(draft({ sections: retold }))).toEqual(expect.arrayContaining([expect.stringMatching(/a section retells the account/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Matty Cash was booked in added time.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a booking in the account/)]));
  });

  it("allows the goal total, a head-to-head score from the brief, and a one-name man inside a name of this match", () => {
    const stake = "Seven points for Notemail, whose man he is.";
    expect(checksOf(draft({ account: `${CLEAN.account} It was a five-goal match.` }))).toEqual([]);
    expect(checksOf(draft({ sections: [CLEAN.sections[0], { ...CLEAN.sections[1], stake }, CLEAN.sections[2]] }))).toEqual([]);
  });

  it("lets a stake give the holder's head-to-head score, which is the league's and not the match's", () => {
    const withH2h = deskDay({
      day: "2026-09-19", gameweek: 5, season: [fixture], clubs: [SPURS, VILLA], standing: { attack: places, defence: places },
      matches: [spursVilla({ holders: new Map([[codeOf("Buendía"), { team: "Notemail", fielded: true, round: 2, h2h: { opponent: "test2", us: 38, them: 34 } }]]), points: new Map([[codeOf("Buendía"), 7]]) })],
    });
    const piece = { ...CLEAN, sections: [CLEAN.sections[0], { ...CLEAN.sections[1], stake: "His seven points have Notemail 38-34 up on test2." }, CLEAN.sections[2]] };
    const faults = checkReports({ headline: "", headlines: [], matches: new Map([[2645244, piece]]) }, { ...ctx, desks: withH2h, blocks: new Map([[2645244, matchBlock(withH2h[0])]]) });
    expect(faults.filter((f) => f.check === "a scoreline the match never had")).toEqual([]);
  });
});

describe("checkReports on a made-up match", () => {
  const faultsOn = (match: ReportMatchInput, account: string) => {
    const desk = deskOf(match);
    const piece = { standfirst: "Arsenal beat Chelsea.", account, sections: [] };
    return checkReports({ headline: "", headlines: [], matches: new Map([[9001, piece]]) }, { desks: [desk], blocks: new Map([[9001, matchBlock(desk)]]), gameweek: 7, past: [] });
  };

  it("lets a man who scored twice be named once", () => {
    const match = matchInput([SAKA, PALMER], [moment("10", "goal", [1, null]), moment("20", "goal", [1, null])], [2, 0]);
    expect(faultsOn(match, "Saka scored twice before half-time.").filter((f) => f.check === "the goals out of order")).toEqual([]);
  });

  it("finds an injury, a penalty and an own goal told at the start of a sentence", () => {
    const james = reportMan(5, "Reece James", "away", { started: false, onAt: "60" });
    const match = matchInput([SAKA, PALMER, james], [
      moment("30", "penalty-goal", [1, null]), moment("60", "substitution", [5, 3], { injury: true }), moment("70", "own-goal", [5, null]),
    ], [2, 0]);
    const account = "Penalty taken by Saka went in. Injury ended Palmer's match. Own goal by James made it two.";
    expect(faultsOn(match, account).filter((f) => f.check.startsWith("leaves out"))).toEqual([]);
  });
});
