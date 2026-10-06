import { leads } from "../league/scoreline";
import type { PeriodPairing } from "../league/selectors";
import type { LeagueTeam } from "../league/types";
import type { LiveTeamScore } from "../league/points";
import type { Deal, Story, StoryResult, StorySide, TeamOfTheWeek } from "./types";

// Every story the week can tell, in a fixed running order: a squeaker, a benched star, a rout, a trade. None is none.

/** A match decided by nothing, as a share of the winning total: points are a league setting, so never a fixed margin. */
const NARROW_SHARE = 0.05;

/** A hammering, on the same scale: the loser did not reach half the winner's total. */
const ROUT_SHARE = 0.5;

export function stories(
  pairings: readonly PeriodPairing[],
  scores: ReadonlyMap<string, LiveTeamScore>,
  /** The week's eleven; null when there is none, or when the caller judges it was not read from the fielded sides. */
  eleven: TeamOfTheWeek | null,
  deals: readonly Deal[],
  /** The period the paper is about; trades are filtered to it. */
  period: number | null,
): Story[] {
  const results = decided(pairings, scores);
  const told: Story[] = [];

  const squeaker = narrowest(results.filter(isSqueaker));
  if (squeaker !== null) told.push({ kind: "squeaker", result: squeaker });

  // The first pick his own manager left out: `picks` runs strongest first.
  const benched = eleven?.picks.find((pick) => !pick.started) ?? null;
  if (benched !== null) {
    const lost = results.find((result) => result.loser.teamId === benched.ownerTeamId) ?? null;
    told.push({ kind: "bench", pick: benched, lost });
  }

  const rout = widest(results.filter(isRout));
  if (rout !== null) told.push({ kind: "rout", result: rout });

  const business = traded(deals, period);
  if (business !== null) told.push({ kind: "trade", ...business });

  return told;
}

/** Every head-to-head with both totals, nobody left to play (null `toPlay` is not nought) and a winner. */
export function decided(
  pairings: readonly PeriodPairing[],
  scores: ReadonlyMap<string, LiveTeamScore>,
): StoryResult[] {
  const results: StoryResult[] = [];

  for (const pairing of pairings) {
    const home = scores.get(pairing.home.teamId);
    const away = scores.get(pairing.away.teamId);
    if (home === undefined || away === undefined) continue;
    if (home.points === null || away.points === null) continue;
    if (home.toPlay !== 0 || away.toPlay !== 0) continue;

    // A dead heat names no winner, so it is left out.
    if (home.points === away.points) continue;

    const [winner, loser] = leads(home.points, away.points)
      ? [side(pairing.home, home.points), side(pairing.away, away.points)]
      : [side(pairing.away, away.points), side(pairing.home, home.points)];

    results.push({ winner, loser, margin: hundredths(winner.points - loser.points) });
  }

  return results;
}

function side(team: LeagueTeam, points: number): StorySide {
  return { teamId: team.teamId, name: team.name, points };
}

// Both refuse a winner on nothing: at a winning total of zero every share is zero, and an unplayed week reads as a rout.

function isSqueaker(result: StoryResult): boolean {
  return result.winner.points > 0 && result.margin <= result.winner.points * NARROW_SHARE;
}

function isRout(result: StoryResult): boolean {
  return result.winner.points > 0 && result.margin >= result.winner.points * ROUT_SHARE;
}

function narrowest(results: readonly StoryResult[]): StoryResult | null {
  return results.reduce<StoryResult | null>(
    (best, result) => (best === null || result.margin < best.margin ? result : best),
    null,
  );
}

function widest(results: readonly StoryResult[]): StoryResult | null {
  return results.reduce<StoryResult | null>(
    (best, result) => (best === null || result.margin > best.margin ? result : best),
    null,
  );
}

/** The first trade dated to this period that names two sides, with those sides; an undated deal never qualifies. */
function traded(deals: readonly Deal[], period: number | null): { deal: Deal; sides: string[] } | null {
  for (const deal of deals) {
    if (deal.kind !== "trade") continue;
    if (deal.period === null || deal.period !== period) continue;
    const sides = [...new Set(deal.inbound.flatMap((player) => player.teamId ?? []))];
    if (sides.length >= 2) return { deal, sides };
  }
  return null;
}

function hundredths(points: number): number {
  return Math.round(points * 100) / 100;
}
