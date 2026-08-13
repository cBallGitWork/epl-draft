import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import type { LeaguePeriod, LeagueTransaction } from "../league/types";
import { availability } from "./availability";
import { nextDeadline } from "./deadline";
import { deals } from "./deals";

const tx = (over: Partial<LeagueTransaction> & { fantraxId: string }): LeagueTransaction => ({
  setId: "s1", kind: "claim", playerName: "A Player", fromTeamId: null, toTeamId: null,
  processedAt: "Wed Aug 12, 2026, 9:14AM", period: 1, executed: true, ...over,
});

describe("deals", () => {
  it("tells a claim and the drop that paid for it as one story", () => {
    // Fantrax files these as two rows sharing a setId. Read apart, the feed says
    // a manager signed somebody and separately, mysteriously, lost somebody.
    const told = deals([
      tx({ fantraxId: "in", playerName: "Schade", kind: "claim", toTeamId: "t1" }),
      tx({ fantraxId: "out", playerName: "Gibbs-White", kind: "drop", fromTeamId: "t1" }),
    ]);
    expect(told).toHaveLength(1);
    expect(told[0].inbound.map((p) => p.playerName)).toEqual(["Schade"]);
    expect(told[0].outbound.map((p) => p.playerName)).toEqual(["Gibbs-White"]);
  });

  it("tells both halves of a trade as one story, and calls it a trade", () => {
    const told = deals([
      tx({ setId: "t", fantraxId: "a", playerName: "One", kind: "trade", fromTeamId: "t1", toTeamId: "t2" }),
      tx({ setId: "t", fantraxId: "b", playerName: "Two", kind: "trade", fromTeamId: "t2", toTeamId: "t1" }),
    ]);
    expect(told).toHaveLength(1);
    expect(told[0].kind).toBe("trade");
    expect(told[0].inbound).toHaveLength(2);
  });

  it("leaves a proposal out of the paper", () => {
    // A trade nobody has accepted is not news, and mistaking one for a fact
    // would report a squad that does not exist.
    expect(deals([tx({ fantraxId: "x", executed: false })])).toEqual([]);
  });

  it("keeps unrelated deals apart when Fantrax sends no setId", () => {
    // Grouping on the empty string would collapse the whole week into one story.
    const told = deals([
      tx({ setId: "", fantraxId: "a", playerName: "One", toTeamId: "t1" }),
      tx({ setId: "", fantraxId: "b", playerName: "Two", toTeamId: "t2" }),
    ]);
    expect(told).toHaveLength(2);
  });

  it("keeps the feed's order, which is newest first", () => {
    // `processedAt` is Fantrax's own unparsed string, so sorting by it would
    // mean inventing a date format. The feed already arrives in order.
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "Newest", toTeamId: "t1" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Older", toTeamId: "t1" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Newest", "Older"]);
  });
});

const footballer = (over: Partial<FootballPlayer>): FootballPlayer => ({
  id: 1, code: 1, name: "Player", fullName: "Player", clubId: 1, squadNumber: null,
  status: "a", news: "", chanceOfPlaying: null, optaCode: null, ...over,
});

const squad = (players: FootballPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "Team",
  players: players.map((player, i) => ({
    slot: { fantraxId: `f${i}`, position: "M", status: "ACTIVE" },
    player,
    stats: [],
  })),
});

describe("availability", () => {
  it("reports the doubts and leaves the fit alone", () => {
    const notes = availability([
      squad([
        footballer({ name: "Fit" }),
        footballer({ name: "Injured", status: "i", news: "Knee injury", chanceOfPlaying: 0 }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Injured"]);
  });

  it("leaves out a player FPL has cleared", () => {
    // 100% with nothing to say is FPL saying he is fine, which is not news.
    expect(availability([squad([footballer({ chanceOfPlaying: 100 })])])).toEqual([]);
  });

  it("prints the least likely to play first", () => {
    const notes = availability([
      squad([
        footballer({ name: "Doubtful", status: "d", chanceOfPlaying: 50, news: "Knock" }),
        footballer({ name: "Out", status: "i", chanceOfPlaying: 0, news: "Hamstring" }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Out", "Doubtful"]);
  });

  it("sorts an unknown chance between a stated zero and a stated hundred", () => {
    // "No comment" is less urgent than "will not play" and more urgent than
    // "fine" — modelling it as either would misinform a manager picking a side.
    const notes = availability([
      squad([
        footballer({ name: "Unknown", status: "d", news: "Late fitness test" }),
        footballer({ name: "Out", status: "i", chanceOfPlaying: 0, news: "Hamstring" }),
        footballer({ name: "Likely", status: "d", chanceOfPlaying: 90, news: "Knock" }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Out", "Unknown", "Likely"]);
  });

  it("says nothing about a squad we could not resolve", () => {
    const unresolved: RosteredTeam = {
      teamId: "t1",
      teamName: "Team",
      players: [{ slot: { fantraxId: "x", position: "M", status: "ACTIVE" }, unresolved: "unmapped" }],
    };
    expect(availability([unresolved])).toEqual([]);
  });
});

const period = (number: number, start: string): LeaguePeriod => ({
  number,
  start,
  end: "2026-12-31T00:00:00.0-0400",
});

describe("nextDeadline", () => {
  it("finds the next lock, not the one that has passed", () => {
    const periods = [
      period(1, "2026-08-21T15:00:00.0-0400"),
      period(2, "2026-08-28T15:00:00.0-0400"),
    ];
    expect(nextDeadline(periods, "2026-08-25T12:00:00Z")).toEqual({
      period: 2,
      at: "2026-08-28T15:00:00.0-0400",
    });
  });

  it("compares instants, not strings", () => {
    // The league's bounds carry -0400 and ours carry Z. Lexically, "2026-08-21T15"
    // sorts before "2026-08-21T19Z" while being four hours later.
    const periods = [period(1, "2026-08-21T15:00:00.0-0400")];
    expect(nextDeadline(periods, "2026-08-21T18:00:00Z")).not.toBeNull();
    expect(nextDeadline(periods, "2026-08-21T20:00:00Z")).toBeNull();
  });

  it("says nothing when the season is over or the calendar is missing", () => {
    expect(nextDeadline([], "2026-08-25T12:00:00Z")).toBeNull();
    expect(nextDeadline([period(1, "2026-08-21T15:00:00.0-0400")], "not a date")).toBeNull();
  });
});
