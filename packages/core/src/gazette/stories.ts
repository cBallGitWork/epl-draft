import { leads } from "../league/scoreline";
import type { PeriodPairing } from "../league/selectors";
import type { LeagueTeam, LiveTeamScore } from "../league/types";
import type { Deal, Story, StoryResult, StorySide, TeamOfTheWeek } from "./types";

// What the paper runs, and in what order.
//
// A front page has a lead story and then the rest of the page. This one had four
// columns of equal weight, with the best story on it — a manager leaving the
// week's best player out — printed as a footnote on a row. This is the editor.
//
// It returns every story it can tell, strongest first: the front page leads on
// the first and runs the next as headlines under it, so a week with a thriller,
// a benched star and a trade in it reads as a page rather than as one sentence.
//
// **It is a running order and not a measurement.** A one-point finish and a
// manager benching the week's best keeper are not the same kind of thing, and no
// common currency converts between them; a number that claimed to would be an
// arbitrary weight wearing the costume of an answer. So the order below is an
// argument, written where it can be argued with, in the same spirit as the
// ranking `teamOfTheWeek` writes down for a defender against a forward:
//
//  1. A match decided by nothing. Two of sixteen managers spent Sunday night on
//     a knife edge, and nothing else on the page is that.
//  2. A manager left the week's best player out. The story nobody else can tell
//     — Fantrax holds both halves and never puts them together.
//  3. A hammering.
//  4. A trade. Rare in a draft league, and the only story an international break
//     can produce.
//
// A week that produces none of them gets no lead and no headlines. A paper does
// not manufacture a story, and the next deadline — which the masthead already
// states two lines up — is not one.

/** A match decided by nothing, as a share of the winning total.
 *
 *  A share and not a number of points, because the points are a commissioner
 *  setting: this league's weeks come out in the tens and a league paying for
 *  every touch would come out in the hundreds, so a threshold written in points
 *  would read every week of one of them as a thriller. A twentieth is one point
 *  in a twenty-point week and two in a forty-five point one, which is about what
 *  a manager means when he says it went to the last match. */
const NARROW_SHARE = 0.05;

/** A hammering, on the same scale, and the same sentence read the other way: at
 *  this share the loser did not reach half the winner's total. */
const ROUT_SHARE = 0.5;

export function stories(
  pairings: readonly PeriodPairing[],
  scores: ReadonlyMap<string, LiveTeamScore>,
  /** The week's eleven, or null when there is none — and null also when the
   *  arrangement it was read from is not the one that was fielded, which is the
   *  caller's judgement to make and not this file's. */
  eleven: TeamOfTheWeek | null,
  deals: readonly Deal[],
): Story[] {
  const results = decided(pairings, scores);
  const told: Story[] = [];

  const squeaker = narrowest(results.filter(isSqueaker));
  if (squeaker !== null) told.push({ kind: "squeaker", result: squeaker });

  // The first pick his own manager left out. `picks` comes back in the order
  // they were argued into the side, so the first is the best of them.
  const benched = eleven?.picks.find((pick) => !pick.started) ?? null;
  if (benched !== null) {
    const lost = results.find((result) => result.loser.teamId === benched.ownerTeamId) ?? null;
    told.push({ kind: "bench", pick: benched, lost });
  }

  const rout = widest(results.filter(isRout));
  if (rout !== null) told.push({ kind: "rout", result: rout });

  const business = traded(deals);
  if (business !== null) told.push({ kind: "trade", ...business });

  return told;
}

/** The week's head-to-heads that can be reported as results.
 *
 *  Three things have to be true and each of them has bitten a screen on this
 *  project already: both totals exist (a dash is not a nought), Fantrax says
 *  nobody has football left (`toPlay` null is "they did not say", which is not
 *  "nobody left"), and somebody won.
 *
 *  Exported because marking last week's predictions needs every result, not the
 *  two the running order picked out: a pundit is marked on all eight calls, and
 *  reading only the thriller and the thrashing would mark him on the two ties he
 *  was least likely to have got wrong. */
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

    // A dead heat. Real, vanishingly rare in a points league, and it names no
    // winner — so it is left out rather than reported with one of the two
    // arbitrarily in front.
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

// Both thresholds refuse a winner who scored nothing, and for the same reason
// rather than for an arithmetic one: a week nobody won anything in has no story
// in it, whichever end of the scale it lands on. Around a winning total of zero
// every share is zero too, so without this an unplayed week reads as a hammering
// — `margin >= 0` is true of every result there is.

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

/** The newest trade that can be written up, and the managers who made it.
 *
 *  A row that does not say who got whom cannot be a headline — "somebody traded"
 *  is worse on a front page than no story at all — so the sides are found here
 *  and carried out, rather than tested for here and worked out again by whatever
 *  prints the sentence. */
function traded(deals: readonly Deal[]): { deal: Deal; sides: string[] } | null {
  for (const deal of deals) {
    if (deal.kind !== "trade") continue;
    const sides = [...new Set(deal.inbound.flatMap((player) => player.teamId ?? []))];
    if (sides.length >= 2) return { deal, sides };
  }
  return null;
}

function hundredths(points: number): number {
  return Math.round(points * 100) / 100;
}
