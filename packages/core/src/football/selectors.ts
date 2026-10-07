import { NOTABLE_SAVES } from "../config";
import { onTheBooks } from "./playerState";
import type { Club, FootballPlayer, FootballSnapshot, Fixture, PlayerMatchStats } from "./types";

/** Earliest kickoff first; an unscheduled match sorts first. */
export const byKickoff = (a: { kickoff: string | null }, b: { kickoff: string | null }) => (a.kickoff ?? "").localeCompare(b.kickoff ?? "");

// Pure read-side selectors over a snapshot.

export function clubById(snapshot: FootballSnapshot): Map<number, Club> {
  return new Map(snapshot.clubs.map((c) => [c.id, c]));
}

/** Keyed by FPL's per-season `id`, so safe only within one snapshot; anything persisted uses `playerByCode`. */
function playerById(snapshot: FootballSnapshot): Map<number, FootballPlayer> {
  return new Map(snapshot.players.map((p) => [p.id, p]));
}

/** Keyed by FPL's season-stable `code`: the lookup anything persisted must use, since `id` is recycled every summer. */
export function playerByCode(snapshot: FootballSnapshot): Map<number, FootballPlayer> {
  return new Map(snapshot.players.map((p) => [p.code, p]));
}

/** One club's players as it stands, the departed dropped by `onTheBooks`; unsorted, since each caller orders its own. */
export function squadOf(snapshot: FootballSnapshot, clubId: number): FootballPlayer[] {
  return snapshot.players.filter((player) => player.clubId === clubId && onTheBooks(player));
}

/** One notable thing a player did in a match; the order here is the reading order under a fixture. */
export interface MatchContribution {
  player: FootballPlayer;
  clubId: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  minutes: number;
}

/** Everyone who did something worth showing in a fixture, best first; merely turning out is not enough. */
export function contributions(
  snapshot: FootballSnapshot,
  fixtureId: number,
): MatchContribution[] {
  const players = playerById(snapshot);
  const rows: MatchContribution[] = [];

  for (const s of snapshot.stats) {
    if (s.fixtureId !== fixtureId) continue;
    if (!isNotable(s)) continue;
    const player = players.get(s.playerId);
    if (!player) continue; // A player FPL knows live but not in bootstrap — skip, don't crash.
    rows.push({
      player,
      clubId: player.clubId,
      goals: s.goals,
      assists: s.assists,
      yellowCards: s.yellowCards,
      redCards: s.redCards,
      saves: s.saves,
      minutes: s.minutes,
    });
  }

  return rows.sort(byImpact);
}

function isNotable(s: PlayerMatchStats): boolean {
  return (
    s.goals > 0 ||
    s.assists > 0 ||
    s.redCards > 0 ||
    s.yellowCards > 0 ||
    s.saves >= NOTABLE_SAVES
  );
}

/** Goals outrank assists outrank cards; a tie goes to more minutes. */
function byImpact(a: MatchContribution, b: MatchContribution): number {
  const score = (c: MatchContribution) =>
    c.goals * 100 + c.assists * 50 + c.redCards * 30 + c.yellowCards * 2;
  return score(b) - score(a) || b.minutes - a.minutes;
}

/** Fixtures for a gameweek in kickoff order, undated last: a TV pick with no time must not sort to the top. */
export function fixturesInOrder(snapshot: FootballSnapshot) {
  return [...snapshot.fixtures].sort((a, b) => {
    if (a.kickoff === b.kickoff) return a.id - b.id;
    if (!a.kickoff) return 1;
    if (!b.kickoff) return -1;
    return a.kickoff.localeCompare(b.kickoff);
  });
}


/** The gameweeks either side of the one in view, null at each end; bounded by the snapshot's own list, not 38. */
export function adjacentGameweeks(snapshot: FootballSnapshot): {
  previous: number | null;
  next: number | null;
} {
  const at = snapshot.gameweeks.indexOf(snapshot.gameweek);
  if (at === -1) return { previous: null, next: null };
  return {
    previous: snapshot.gameweeks[at - 1] ?? null,
    next: snapshot.gameweeks[at + 1] ?? null,
  };
}

/** Whether a gameweek exists this season, before a route renders one typed into the URL. */
export function hasGameweek(snapshot: FootballSnapshot, gameweek: number): boolean {
  return snapshot.gameweeks.includes(gameweek);
}

/** The season's dated kickoffs, undated fixtures dropped.
 *  Typed structurally: importing `league/calendar.ts`'s `GameweekKickoff` would make football depend on league. */
export function datedKickoffs(
  fixtures: readonly Fixture[],
): { gameweek: number; kickoff: string }[] {
  return fixtures.flatMap((fixture) =>
    fixture.gameweek === null || fixture.kickoff === null
      ? []
      : [{ gameweek: fixture.gameweek, kickoff: fixture.kickoff }],
  );
}
