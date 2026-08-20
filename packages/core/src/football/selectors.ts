import { NOTABLE_SAVES } from "../config";
import type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
  FootballSnapshot,
  PlayerMatchStats,
} from "./types";

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

/** True when any match in the snapshot is in play — the app's single source of
 *  truth for whether to show the live treatment and poll faster. */
export function isMatchdayLive(snapshot: FootballSnapshot): boolean {
  return snapshot.fixtures.some((f) => f.status === "live");
}

/** Whether the round in view is under way: from its first kickoff until its last
 *  dated match is over.
 *
 *  Deliberately wider than `isMatchdayLive`. Saturday lunchtime between two
 *  kickoffs is still matchday to someone holding a phone, but nothing is in play,
 *  so the two answer different questions: this one decides whether the Matchday
 *  section exists at all, while `isMatchdayLive` keeps driving the live treatment
 *  and the poll rate.
 *
 *  The window closes on `finished` rather than on FPL's `data_checked`, which
 *  settles bonus a day or two later. The section is for watching football, not
 *  for waiting on bonus points; that a score is still provisional is said on the
 *  page, where a reader can see it.
 *
 *  Undated fixtures are ignored at both ends. A TV pick with no time cannot open
 *  a window it has no place in, and a match postponed out of its slot must not
 *  hold one open for a month. A postponement FPL leaves dated does hold it open,
 *  which is the honest reading: that gameweek genuinely has not finished. */
export function duringGameweek(snapshot: FootballSnapshot, at: string): boolean {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return false;

  let firstKickoff = Infinity;
  let everythingFinished = true;
  let anyDated = false;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    if (Number.isNaN(kickoff)) continue;
    anyDated = true;
    if (kickoff < firstKickoff) firstKickoff = kickoff;
    if (fixture.status !== "finished") everythingFinished = false;
  }

  return anyDated && now >= firstKickoff && !everythingFinished;
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

/** Whether a ball has been kicked in this round yet.
 *
 *  A different question from `gameweekStatus`, and the distinction is the whole
 *  point: at six on a Saturday evening a round with nine results and a Monday
 *  night match left has no LIVE fixture and is not FINISHED, so its status is
 *  "upcoming" — correctly, because a full-time label on it would be a lie. But
 *  nine of its ten results exist, and a view that reads that status as "no
 *  football has happened" hides every one of them until Monday.
 *
 *  Asked of the fixtures rather than of the status for exactly that reason: a
 *  three-state label cannot answer a two-state question, and trying to make it
 *  is how the schedule came to blank its own scoreboard every weekend. */
export function gameweekStarted(fixtures: readonly Fixture[], gameweek: number): boolean {
  return fixtures.some(
    (fixture) => fixture.gameweek === gameweek && fixture.status !== "upcoming",
  );
}

/** How a whole round stands: in play while any match is, done once every one of
 *  them is, and upcoming until the first ball is kicked.
 *
 *  Asked of season-wide fixtures rather than of a snapshot, because the caller
 *  labelling thirty-eight rounds at once holds the season and not one round of
 *  it. A gameweek with no fixtures answers "upcoming" — "every match has ended"
 *  is vacuously true of none, and a full-time label on a week that has not been
 *  scheduled is the confident wrong answer. */
export function gameweekStatus(
  fixtures: readonly Fixture[],
  gameweek: number,
): FixtureStatus {
  const round = fixtures.filter((fixture) => fixture.gameweek === gameweek);
  if (round.length === 0) return "upcoming";
  if (round.some((fixture) => fixture.status === "live")) return "live";
  return round.every((fixture) => fixture.status === "finished") ? "finished" : "upcoming";
}

/** How settled a finished round is. Three rungs, because "over" is three
 *  different claims on a Saturday night and a screen may only make the one it
 *  can stand behind. */
export type FinishedState = "bonus-settling" | "provisional" | "final";

/** Where a round is on the ladder down from the last whistle, or null while it
 *  is still going — or has not started.
 *
 *  The rungs, in the order they actually happen: the referee blows up and
 *  `finished_provisional` flips, so `status` reads finished while FPL is still
 *  adding bonus (`bonus-settling`); bonus lands (`provisional`); a day or two
 *  later FPL signs the round off (`final`).
 *
 *  **"Final" is claimed only at `data_checked`.** A Final that later moves is
 *  the confident wrong answer wearing the costume that looks most like an
 *  answer, and the whole football layer exists to refuse that trade.
 *
 *  Null covers two states a caller must not conflate with each other but may
 *  render the same way — nothing to say: a round in play, and a round nobody has
 *  kicked off yet. `isMatchdayLive` is what separates them, and callers pair the
 *  two rather than this one growing a fourth answer it would have to invent.
 *
 *  Undated fixtures are ignored, on the same rule as `duringGameweek`: a TV pick
 *  with no time cannot hold a round open, and a round of nothing but undated
 *  matches has not finished — it has not been scheduled. */
export function roundFinished(snapshot: FootballSnapshot): FinishedState | null {
  let anyDated = false;
  let allFinished = true;
  let allSettled = true;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    anyDated = true;
    if (fixture.status !== "finished") allFinished = false;
    if (!fixture.settled) allSettled = false;
  }

  if (!anyDated || !allFinished) return null;
  if (!allSettled) return "bonus-settling";
  return snapshot.dataChecked ? "final" : "provisional";
}
