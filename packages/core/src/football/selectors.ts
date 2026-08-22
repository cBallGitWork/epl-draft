import { NOTABLE_SAVES } from "../config";
import type { Club, FootballPlayer, FootballSnapshot, PlayerMatchStats } from "./types";

// Pure read-side selectors over a snapshot. Kept here rather than in components
// so they stay unit-testable — the same rule that let the World Cup app's
// competition logic survive a change of provider intact.

export function clubById(snapshot: FootballSnapshot): Map<number, Club> {
  return new Map(snapshot.clubs.map((c) => [c.id, c]));
}

/** Keyed by FPL's per-season `id`. Deliberately not exported: `id` is recycled
 *  every summer, so this is safe only within a single snapshot — which is the
 *  only place it is used, joining live stats back to the players in the same
 *  payload. Anything that outlives a snapshot uses `playerByCode`. */
function playerById(snapshot: FootballSnapshot): Map<number, FootballPlayer> {
  return new Map(snapshot.players.map((p) => [p.id, p]));
}

/** Keyed by FPL's season-stable `code` rather than its per-season `id`.
 *
 *  This is the lookup anything persisted has to use. The identity bridge stores
 *  `code` because `id` is recycled every summer (CODE_RULES §3), so a mapping
 *  built last August resolves through here and would resolve to the wrong
 *  footballer through `playerById`. */
export function playerByCode(snapshot: FootballSnapshot): Map<number, FootballPlayer> {
  return new Map(snapshot.players.map((p) => [p.code, p]));
}

/** One notable thing a player did in a match. The drop-down under a fixture is
 *  built from these, so the ordering here is the reading order on screen. */
export interface MatchContribution {
  player: FootballPlayer;
  clubId: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  minutes: number;
}

/** Everyone who did something worth showing in a fixture, best first.
 *
 *  "Worth showing" deliberately excludes merely turning out: a list of 22 players
 *  who each did nothing is noise, and the drop-down exists to answer "what
 *  happened in this match", not "who played". */
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
      bonus: s.bonus,
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
    s.bonus > 0 ||
    s.saves >= NOTABLE_SAVES
  );
}

/** Goals outrank assists outrank cards. Within a tie, more minutes first so the
 *  ordering is stable rather than arbitrary. */
function byImpact(a: MatchContribution, b: MatchContribution): number {
  const score = (c: MatchContribution) =>
    c.goals * 100 + c.assists * 50 + c.redCards * 30 + c.bonus * 5 + c.yellowCards * 2;
  return score(b) - score(a) || b.minutes - a.minutes;
}

/** Fixtures for a gameweek, in kickoff order with undated matches last — TV picks
 *  routinely have no time yet and must not sort to the top of the list. */
export function fixturesInOrder(snapshot: FootballSnapshot) {
  return [...snapshot.fixtures].sort((a, b) => {
    if (a.kickoff === b.kickoff) return a.id - b.id;
    if (!a.kickoff) return 1;
    if (!b.kickoff) return -1;
    return a.kickoff.localeCompare(b.kickoff);
  });
}


/** The rounds either side of the one in view, or null at each end of the season.
 *
 *  Bounds come from the snapshot's own gameweek list rather than a constant 38 —
 *  FPL decides how long a season is, and a season that gains a round to a
 *  postponement should not need a code change. */
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

/** Whether a round exists in this season at all — what a route needs before it
 *  renders a gameweek someone typed into the URL. */
export function hasGameweek(snapshot: FootballSnapshot, gameweek: number): boolean {
  return snapshot.gameweeks.includes(gameweek);
}

/** Whether FPL has said anything that should worry a manager.
 *
 *  One rule, in one place, because two readers had two rules: the paper's doubts
 *  column counted a stated chance of playing and the player card did not, so the
 *  same footballer could be a doubt on one tab and fit on the next.
 *
 *  A hundred percent with nothing written against it is FPL saying "he is fine",
 *  which is the one combination that is not a doubt despite carrying a number. */
export function isDoubtful(player: FootballPlayer): boolean {
  if (player.news === "" && player.chanceOfPlaying === 100) return false;
  return player.status !== "a" || player.news !== "" || player.chanceOfPlaying !== null;
}
