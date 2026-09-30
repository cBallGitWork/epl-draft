import { describe, expect, it } from "vitest";
import stream from "../__fixtures__/plTextstreamAssists.json";
import fixture from "../__fixtures__/plFixtureAssists.json";
import type { MatchEvent } from "../types";
import type { RawPlEvent, RawPlFixture, RawPlTextstream } from "./raw";
import { creditRoundAssists, streamRedCards, type FixtureStream } from "./wire";

// Manchester United 5-2 Ipswich Town, gameweek 2 — the fixture `assists.test.ts` records.
// Three of United's assists are ones Opta never placed, owed to three different men, so
// arithmetic alone cannot resolve them and only the RIGHT match's commentary can.
const EVENTS = (stream as unknown as RawPlTextstream).events.content as RawPlEvent[];
const DETAIL = fixture as unknown as RawPlFixture;
const codes = new Map(
  (DETAIL.teamLists ?? []).flatMap((list) =>
    list === null ? [] : [...list.lineup, ...list.substitutes].map((p) => [p.id, p.id + 1_000_000] as const),
  ),
);

const CUNHA = 51202 + 1_000_000;
const MAGUIRE = 9566 + 1_000_000;
const FERNANDES = 23396 + 1_000_000;
const MBEUMO = 66360 + 1_000_000;
const GREAVES = 49254 + 1_000_000;
const MUN = 14;
const IPS = 9;
const CODE = 2_600_002;
const FIXTURE = { id: 12, code: CODE, homeClubId: MUN, awayClubId: IPS };

const players = [
  { id: 1, code: CUNHA, clubId: MUN },
  { id: 2, code: MAGUIRE, clubId: MUN },
  { id: 3, code: FERNANDES, clubId: MUN },
  { id: 4, code: MBEUMO, clubId: MUN },
  { id: 5, code: GREAVES, clubId: IPS },
];

// What FPL paid: Cunha 2, Maguire 1, Fernandes 1, Mbeumo 1.
const stats = [
  { playerId: 1, fixtureId: 12, assists: 2 },
  { playerId: 2, fixtureId: 12, assists: 1 },
  { playerId: 3, fixtureId: 12, assists: 1 },
  { playerId: 4, fixtureId: 12, assists: 1 },
];

const goal = (id: number, minute: string, kind: MatchEvent["kind"], ...who: (number | null)[]): MatchEvent => ({
  id, fixtureCode: CODE, kind, minute, seconds: 0, absolute: null, text: "", players: who,
});

// United's five as the round feed has them: Opta placed the 40th and 82nd only.
const goals = [
  goal(1, "40", "goal", FERNANDES, CUNHA),
  goal(2, "56", "own-goal", GREAVES),
  goal(3, "61", "penalty-goal", FERNANDES, null),
  goal(4, "68", "goal", FERNANDES, null),
  goal(5, "82", "goal", MBEUMO, FERNANDES),
];

const assisters = (credited: MatchEvent[]) => credited.map((g) => [g.minute, g.players[1] ?? null]);

describe("creditRoundAssists", () => {
  it("credits the three Opta never placed, from this match's own commentary", () => {
    const streams = new Map<number, FixtureStream>([[CODE, { events: EVENTS, kickoffMillis: null }]]);
    expect(assisters(creditRoundAssists(goals, players, [FIXTURE], stats, streams, codes, new Map()))).toEqual([
      ["40", CUNHA],
      ["56", MAGUIRE],
      ["61", CUNHA],
      ["68", MBEUMO],
      ["82", FERNANDES],
    ]);
  });

  it("credits the three with no commentary at all, off the stats league's kinds", () => {
    const kinds = new Map([
      [MAGUIRE, { penaltyWon: 0, ownGoalForced: 1, freeKickWon: 0, freeKickGoals: 0 }],
      [CUNHA, { penaltyWon: 1, ownGoalForced: 0, freeKickWon: 0, freeKickGoals: 0 }],
    ]);
    expect(assisters(creditRoundAssists(goals, players, [FIXTURE], stats, new Map(), codes, kinds))).toEqual([
      ["40", CUNHA],
      ["56", MAGUIRE],
      ["61", CUNHA],
      ["68", MBEUMO],
      ["82", FERNANDES],
    ]);
  });

  it("never reads another match's commentary", () => {
    // The wire looked streams up by FPL's fixture id and got 1992's matches for all fifty of GW1-5.
    const streams = new Map<number, FixtureStream>([[FIXTURE.id, { events: EVENTS, kickoffMillis: null }]]);
    expect(assisters(creditRoundAssists(goals, players, [FIXTURE], stats, streams, codes, new Map()))).toEqual([
      ["40", CUNHA],
      ["56", null],
      ["61", null],
      ["68", null],
      ["82", FERNANDES],
    ]);
  });
});

describe("streamRedCards", () => {
  it("keeps only the sendings-off, filed under the stream's fixture code", () => {
    const red: RawPlEvent = { id: 900, type: "red card", text: "Sent off.", time: { label: "77", secs: 4620 }, playerIds: [9566] };
    const streams = new Map<number, FixtureStream>([[CODE, { events: [...EVENTS, red], kickoffMillis: 0 }]]);
    const cards = streamRedCards(streams, codes);
    expect(cards.every((card) => card.kind === "red-card" && card.fixtureCode === CODE)).toBe(true);
    expect(cards.some((card) => card.id === 900 && card.players[0] === MAGUIRE)).toBe(true);
  });
});
