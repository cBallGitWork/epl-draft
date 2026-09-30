import type { Club, Fixture } from "../types";
import type { IntelManifest } from "./types";

// Each club's Dixon-Coles strength from the sister repo, and the 1–20 ease ranks the fixture planner draws.
// 1.0 is league average at both ends; a higher defence concedes less.

export interface Venues {
  home: number;
  away: number;
}

export interface ClubStrength {
  /** FPL's season-stable club code. */
  code: number;
  shortName: string;
  attack: Venues;
  defence: Venues;
  /** Matches behind each rating, so a thin one can say so. */
  games: Venues;
}

export interface IntelStrength {
  manifest: IntelManifest;
  clubs: ClubStrength[];
}

/** Attack rates who your forwards face (their defence); Defence rates who your back line faces (their attack). */
export type PlannerView = "attack" | "defence";
export type Venue = "home" | "away";

export interface PlannerCell {
  opponent: Club;
  home: boolean;
  /** 1 is the easiest opponent; null when he has no rating. */
  rank: number | null;
}

export interface PlannerRow {
  club: Club;
  /** One list per gameweek: empty is a blank, two is a double. */
  cells: PlannerCell[][];
  mean: number;
}

/** Every rated club by code; a rating that is not a positive number drops the club rather than ranking it. */
export function strengthIntel(file: IntelStrength | null): Map<number, ClubStrength> {
  const byCode = new Map<number, ClubStrength>();
  for (const club of file?.clubs ?? []) {
    if (!Number.isInteger(club?.code)) continue;
    if (![club.attack, club.defence].every((venues) => rated(venues?.home) && rated(venues?.away))) continue;
    byCode.set(club.code, club);
  }
  return byCode;
}

/** Each club ranked as an OPPONENT playing at `venue`, 1 the easiest; ties share a rank. */
export function easeRanks(
  strengths: Map<number, ClubStrength>,
  view: PlannerView,
  venue: Venue,
): Map<number, number> {
  return competitionRanks(strengths, (club) => (view === "attack" ? club.defence : club.attack)[venue], "ascending");
}

/** Two ranks to a step, onto the planner's ten-step ease ramp. */
export function easeStep(rank: number): number {
  return Math.min(10, Math.max(1, Math.ceil(rank / 2)));
}

/** One club's own strength: its rank at each venue, 1 the best. */
export interface StrengthRank {
  code: number;
  club: string;
  home: number;
  away: number;
}

/** Every rated club by its own attack or defence at both venues, the weakest (easiest to face) first; ties share a rank. */
export function strengthTable(strengths: Map<number, ClubStrength>, measure: "attack" | "defence"): StrengthRank[] {
  const rank = (venue: Venue) => competitionRanks(strengths, (club) => club[measure][venue], "ascending");
  const home = rank("home");
  const away = rank("away");
  return [...strengths.values()]
    .map((club) => ({ code: club.code, club: club.shortName, home: home.get(club.code) ?? 0, away: away.get(club.code) ?? 0 }))
    .sort((a, b) => a.home + a.away - (b.home + b.away) || a.club.localeCompare(b.club));
}

/** Each club's place by `rating`, 1 first in the given direction; a tie shares the higher place (1, 2, 2, 4). */
function competitionRanks(
  strengths: Map<number, ClubStrength>,
  rating: (club: ClubStrength) => number,
  direction: "ascending" | "descending",
): Map<number, number> {
  const sign = direction === "ascending" ? 1 : -1;
  const ordered = [...strengths.values()].sort((a, b) => sign * (rating(a) - rating(b)));
  const ranks = new Map<number, number>();
  ordered.forEach((club, index) => {
    const previous = ordered[index - 1];
    const tied = previous !== undefined && rating(previous) === rating(club);
    ranks.set(club.code, tied ? (ranks.get(previous.code) ?? index + 1) : index + 1);
  });
  return ranks;
}

/** `count` gameweeks from the first with a match still to finish, stopping at the season's last. */
export function plannerGameweeks(fixtures: readonly Fixture[], count: number): number[] {
  const open = fixtures.filter((f) => f.status !== "finished" && f.gameweek !== null).map((f) => f.gameweek as number);
  if (open.length === 0) return [];
  const first = Math.min(...open);
  const last = Math.max(...fixtures.map((f) => f.gameweek ?? 0));
  return Array.from({ length: Math.min(count, last - first + 1) }, (_, index) => first + index);
}

/** Every club's run over `gameweeks`, easiest first: a double averages its two, a blank counts as the hardest. */
export function plannerRows(
  fixtures: readonly Fixture[],
  clubs: readonly Club[],
  strengths: Map<number, ClubStrength>,
  view: PlannerView,
  gameweeks: readonly number[],
): PlannerRow[] {
  const ranks = { home: easeRanks(strengths, view, "home"), away: easeRanks(strengths, view, "away") };
  const hardest = strengths.size;
  const byId = new Map(clubs.map((club) => [club.id, club]));

  return clubs
    .map((club) => {
      const cells = gameweeks.map((gameweek) =>
        fixtures
          .filter((f) => f.gameweek === gameweek && (f.homeClubId === club.id || f.awayClubId === club.id))
          .flatMap((f): PlannerCell[] => {
            const home = f.homeClubId === club.id;
            const opponent = byId.get(home ? f.awayClubId : f.homeClubId);
            if (opponent === undefined) return [];
            return [{ opponent, home, rank: ranks[home ? "away" : "home"].get(opponent.code) ?? null }];
          }),
      );
      const perRound = cells.map((round) => {
        const rated = round.flatMap((cell) => (cell.rank === null ? [] : [cell.rank]));
        return rated.length === 0 ? (round.length === 0 ? hardest : null) : average(rated);
      });
      const counted = perRound.filter((value): value is number => value !== null);
      return { club, cells, mean: counted.length === 0 ? hardest : average(counted), rounds: perRound };
    })
    .sort((a, b) => a.mean - b.mean || nearer(a.rounds, b.rounds) || a.club.shortName.localeCompare(b.club.shortName))
    .map(({ rounds: _rounds, ...row }) => row);
}

/** A tie goes to the kinder run soonest: the first gameweek that differs decides. */
function nearer(a: readonly (number | null)[], b: readonly (number | null)[]): number {
  for (let at = 0; at < Math.min(a.length, b.length); at += 1) {
    const difference = (a[at] ?? Infinity) - (b[at] ?? Infinity);
    if (difference !== 0 && Number.isFinite(difference)) return difference;
  }
  return 0;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rated(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
