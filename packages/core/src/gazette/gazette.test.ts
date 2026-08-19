import { describe, expect, it } from "vitest";
import type { FootballPlayer, PlayerMatchStats } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import type { LeaguePeriod, LeagueTransaction } from "../league/types";
import { availability } from "./availability";
import { nextDeadline } from "./deadline";
import { deals } from "./deals";
import { teamOfTheWeek } from "./teamOfTheWeek";

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
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "Newest", toTeamId: "t1" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Older", toTeamId: "t1",
        processedAt: "Tue Aug 11, 2026, 9:14AM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Newest", "Older"]);
  });

  it("tells one week from two views rather than every claim then every trade", () => {
    // Claims and trades are separate reads, each newest-first on its own. The
    // trade here happened a minute before the claim and belongs below it.
    const told = deals([
      tx({ setId: "c", fantraxId: "1", playerName: "Claimed", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 9:14AM" }),
      tx({ setId: "t", fantraxId: "2", playerName: "Traded", kind: "trade", toTeamId: "t2",
        processedAt: "Wed Aug 12, 2026, 9:13AM" }),
      tx({ setId: "c2", fantraxId: "3", playerName: "Older claim", toTeamId: "t1",
        processedAt: "Mon Aug 10, 2026, 4:02PM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Claimed", "Traded", "Older claim"]);
  });

  it("reads midnight and noon as Fantrax writes them", () => {
    // 12:30AM is the small hours and 12:30PM is lunchtime. Getting these the
    // wrong way round puts a whole day's business twelve hours out of place.
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "Small hours", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 12:30AM" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Lunchtime", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 12:30PM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Lunchtime", "Small hours"]);
  });

  it("leaves the order alone rather than half-sort a feed it cannot date", () => {
    // A date we stop understanding — a translated month, a changed format —
    // should cost the section its interleaving, not its contents. Deciding one
    // row's place by an accident of the comparator is the worse outcome.
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "First", toTeamId: "t1",
        processedAt: "mer. 12 août 2026, 9:14" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Second", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 9:15AM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["First", "Second"]);
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

const limits = {
  maxTotalPlayers: 15,
  maxActivePlayers: 11,
  maxReservePlayers: 4,
  maxActiveByPosition: { D: 5, F: 3, G: 1, M: 5 },
};

const performer = (
  name: string,
  position: string,
  stats: Partial<PlayerMatchStats>,
  teamId = "t1",
  status = "ACTIVE",
): RosteredTeam => ({
  teamId,
  teamName: teamId,
  players: [
    {
      slot: { fantraxId: name, position, status },
      player: footballer({ name }),
      stats: [{
        playerId: 1, fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false,
        goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0,
        redCards: 0, saves: 0, bonus: 0, bps: 0, defensiveContribution: 0, expectedGoals: 0,
        expectedAssists: 0, ...stats,
      }],
    },
  ],
});

describe("teamOfTheWeek", () => {
  it("ranks goals above assists above a clean sheet", () => {
    const picked = teamOfTheWeek(
      [
        performer("Scorer", "F", { goals: 2 }),
        performer("Provider", "M", { assists: 2 }),
        performer("Stopper", "D", { cleanSheet: true }),
      ],
      limits,
    );
    expect(picked.picks.map((p) => p.playerName)).toEqual(["Scorer", "Provider", "Stopper"]);
  });

  it("obeys the league's own position caps rather than a formation we chose", () => {
    // Two keepers both had a good week; the league allows one on the field.
    const picked = teamOfTheWeek(
      [
        performer("Keeper A", "G", { saves: 8, cleanSheet: true }, "t1"),
        performer("Keeper B", "G", { saves: 7, cleanSheet: true }, "t2"),
      ],
      limits,
    );
    expect(picked.picks.map((p) => p.playerName)).toEqual(["Keeper A"]);
  });

  it("never picks more than may take the field", () => {
    const squads = Array.from({ length: 14 }, (_, i) =>
      performer(`M${i}`, "M", { assists: 1 }, `t${i}`),
    );
    expect(teamOfTheWeek(squads, limits).picks.length).toBeLessThanOrEqual(11);
  });

  it("names the owner, which is the entire joke", () => {
    const picked = teamOfTheWeek([performer("Haaland", "F", { goals: 3 }, "someone")], limits);
    expect(picked.picks[0].ownerTeamId).toBe("someone");
    expect(picked.picks[0].ownerName).toBe("someone");
  });

  it("marks a player his own manager benched", () => {
    // The best story on the page: he scored twice from the reserves.
    const picked = teamOfTheWeek(
      [performer("Benched", "F", { goals: 2 }, "t1", "RESERVE")],
      limits,
    );
    expect(picked.picks[0].started).toBe(false);
  });

  it("leaves out anyone who did not play", () => {
    expect(teamOfTheWeek([performer("Unused", "F", { minutes: 0 })], limits).picks).toEqual([]);
  });

  it("counts the shape back to front, not alphabetically", () => {
    // One keeper, two defenders, three forwards. The caps arrive keyed D, F, G,
    // M, so reading them in payload order would say "2-3-1" — a formation with
    // the keeper up front. Back to front it is "1-2-3".
    const picked = teamOfTheWeek(
      [
        performer("K", "G", { cleanSheet: true, saves: 6 }, "t1"),
        performer("D1", "D", { goals: 1 }, "t2"),
        performer("D2", "D", { assists: 1 }, "t3"),
        performer("F1", "F", { goals: 3 }, "t4"),
        performer("F2", "F", { goals: 2 }, "t5"),
        performer("F3", "F", { goals: 1, assists: 1 }, "t6"),
      ],
      limits,
    );
    expect(picked.shape).toBe("1-2-3");
  });

  it("will not fill a position the league sets no cap for", () => {
    // A commissioner adding "W" for wingers has not said how many may play, and
    // inventing that number is inventing a rule.
    const picked = teamOfTheWeek([performer("Winger", "W", { goals: 3 })], limits);
    expect(picked.picks).toEqual([]);
  });

  it("has nothing to say before a ball is kicked", () => {
    expect(teamOfTheWeek([], limits)).toEqual({ picks: [], shape: "" });
  });
});
