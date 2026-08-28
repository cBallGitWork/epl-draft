import { describe, expect, it } from "vitest";
import type { PeriodPairing } from "../league/selectors";
import type { LiveTeamScore } from "../league/types";
import { buildBrief } from "./brief";
import type { Brief } from "./brief";
import type { Pick, TeamOfTheWeek } from "./types";

// These assert what the brief REFUSES to let a writer say, which is most of what
// it is for. A model handed a scoreline will narrate who scored first and in
// what minute; the only defence is never handing it a fact it can hang that on,
// and saying so beside the ones we do hand over.

const NAMES: Record<string, string> = { a: "Craig", b: "Rivals" };

const pairing = (home: string, away: string): PeriodPairing => ({
  home: { teamId: home, name: NAMES[home] ?? home },
  away: { teamId: away, name: NAMES[away] ?? away },
});

const scores = (over: Record<string, [number | null, number | null]>) =>
  new Map<string, LiveTeamScore>(
    Object.entries(over).map(([teamId, [points, toPlay]]) => [teamId, { teamId, points, toPlay }]),
  );

const pick = (over: Partial<Pick> = {}): Pick => ({
  fantraxId: "p1",
  playerName: "Pickford",
  playerCode: 1,
  clubId: 1,
  position: "G",
  ownerTeamId: "a",
  ownerName: "Craig",
  started: true,
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: true,
  saves: 4,
  score: 50,
  ...over,
});

const brief = (over: Partial<Brief> = {}): Brief => ({
  kind: "report",
  gameweek: 1,
  period: 1,
  teams: [
    { teamId: "a", name: "Craig" },
    { teamId: "b", name: "Rivals" },
  ],
  pairings: [pairing("a", "b")],
  scores: scores({ a: [45, 0], b: [31, 0] }),
  stories: [],
  eleven: null,
  fielded: true,
  deals: [],
  doubts: [],
  marked: null,
  pedigree: new Map(),
  ...over,
});

describe("buildBrief", () => {
  it("hands over ids and names together, so a name is never invented", () => {
    const text = buildBrief(brief());
    expect(text).toContain("Craig [a]");
    expect(text).toContain("never the name");
  });

  it("says a tie still being played is not a result", () => {
    const text = buildBrief(brief({ scores: scores({ a: [45, 0], b: [31, 3] }) }));
    expect(text).toContain("IN PLAY");
    expect(text).toContain("do not say anyone won it");
    expect(text).not.toContain("FINAL");
  });

  it("says a dash is not a nought, beside the dash", () => {
    const text = buildBrief(brief({ scores: scores({ a: [45, 0], b: [null, 0] }) }));
    expect(text).toContain("v — Rivals");
    expect(text).toContain("NOT nought");
  });

  it("forbids the bench story outright when the lineups are not the ones played", () => {
    const eleven: TeamOfTheWeek = {
      picks: [pick({ started: false })],
      lines: [{ position: "G", picks: [pick({ started: false })] }],
      shape: "1",
    };
    const withheld = buildBrief(brief({ eleven, fielded: false }));
    expect(withheld).toContain("Do NOT say anybody was benched");
    expect(withheld).not.toContain("BENCHED:");

    const allowed = buildBrief(brief({ eleven, fielded: true }));
    expect(allowed).toContain("— BENCHED");
  });

  it("asks a preview for calls and a report for none", () => {
    expect(buildBrief(brief({ kind: "preview" }))).toContain("callsTeamId");
    expect(buildBrief(brief({ kind: "preview" }))).toContain("projections, not scores");
    expect(buildBrief(brief({ kind: "report" }))).toContain("leave `callsTeamId` unset");
  });

  it("leaves out every block it has nothing for", () => {
    // A brief padded with empty headings is a brief that invites a model to fill
    // them, which is exactly how a paper gets a transfer nobody made.
    const quiet = buildBrief(brief({ pairings: [], scores: new Map() }));
    expect(quiet).not.toContain("THE TIES");
    expect(quiet).not.toContain("WHO IS HURT");
    expect(quiet).not.toContain("THE WEEK'S BUSINESS");
    expect(quiet).not.toContain("YOUR LAST COLUMN");
  });

  it("gives pedigree, and says not to lean on it", () => {
    // A draft league's best story is the gap between what a pick cost and what
    // he did. A paper that mentions every player's round is a spreadsheet.
    const one = pick({ fantraxId: "late" });
    const eleven: TeamOfTheWeek = {
      picks: [one],
      lines: [{ position: "G", picks: [one] }],
      shape: "1",
    };
    const text = buildBrief(
      brief({
        eleven,
        pedigree: new Map([["late", { fantraxId: "late", teamId: "a", round: 14, overall: 212 }]]),
      }),
    );
    expect(text).toContain("[R14, pick 212]");
    expect(text).toContain("ONLY WHEN IT IS THE STORY");
  });

  it("calls an undrafted man a wire pickup rather than a missing one", () => {
    const one = pick({ fantraxId: "claimed" });
    const eleven: TeamOfTheWeek = {
      picks: [one],
      lines: [{ position: "G", picks: [one] }],
      shape: "1",
    };
    const text = buildBrief(
      brief({
        eleven,
        pedigree: new Map([["someone-else", { fantraxId: "x", teamId: "a", round: 1, overall: 1 }]]),
      }),
    );
    expect(text).toContain("[off the wire]");
  });

  it("says nothing about pedigree before a draft has completed", () => {
    // The real league is in this state until 10 Oct.
    const one = pick();
    const eleven: TeamOfTheWeek = {
      picks: [one],
      lines: [{ position: "G", picks: [one] }],
      shape: "1",
    };
    const text = buildBrief(brief({ eleven, pedigree: new Map() }));
    expect(text).not.toContain("ONLY WHEN IT IS THE STORY");
    expect(text).not.toContain("off the wire");
  });

  it("makes the pundit own last week's score", () => {
    expect(buildBrief(brief({ marked: { right: 5, called: 8 } }))).toContain("called 5 of 8");
  });
});
