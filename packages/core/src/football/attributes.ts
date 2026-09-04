import type { FootballPlayer } from "./types";

// Championship Manager's attribute grid, for a real footballer.
//
// CM's thirty-one attributes are Sports Interactive's, hand-authored per player
// and licensed. There is no feed for them — the route through FM26 is a plugin,
// an in-game keypress and a manual CSV of whichever columns happened to be on
// screen — and republishing SI's numbers is not ours to do. So every rating here
// is OURS, derived from play we already measure, and says so.
//
// The scale is CM's 1–20 and the ranking is a PERCENTILE within the league, not
// an absolute. That is the only honest way to turn "2.1 tackles per ninety" into
// "14": fourteen has never meant anything except "better at this than most", and
// the population is the only thing that can say what most is.
//
// **Rated against everyone, never within a position.** A defender's Finishing
// comes out low and a striker's Marking comes out low, which is exactly what CM
// shows — Michael Ball is Finishing 8, Marking 17 (`cm9900/11.jpg`). Ranking
// within position would flatten every grid to a diagonal of tens and lose the
// one thing the screen is for. It also handles keepers for free: an outfielder
// makes no saves, so he sits at the bottom of Handling, which is where CM puts
// him at 1.
//
// What we cannot measure gets NO ROW. Pace, Acceleration, Agility, Balance,
// Bravery and Flair are not in this file because nothing we hold measures them,
// and a fabricated fourteen is worse than a missing line — DESIGN §7, the same
// rule that makes absence a dash.
//
// **A rating is a ranking in THIS season, not a claim about the footballer**, and
// early in a season those come apart in one direction. Most of the division is on
// nought for most of these measures, so any non-zero figure clears more than half
// the league at once: on 4 Sep 2026, three rounds in, Maguire's 0.01 expected
// assists rated Passing 18 — true as a ranking and worthless as a reading. Left
// undamped deliberately. Damping needs a confidence model nobody asked for and
// turns a number that is honest-but-thin into one that cannot be explained; it
// settles as the season fills, and `docs/ui/player.md` says so on the screen's
// own page.

/** One attribute, as the grid draws it. */
export interface Attribute {
  /** Championship Manager's own label, spelled CM's way. */
  name: string;
  /** 1–20, or null when he has not played enough for the rate to mean anything. */
  rating: number | null;
  /** What it was derived from. DESIGN §7: every derived figure says whose it is,
   *  and ours have to say what they are made of as well. */
  from: string;
}

/** One man's inputs. The set-piece share is not on `FootballPlayer` because it
 *  is the sister repo's reading rather than FPL's, and it arrives per club. */
export interface Scouted {
  player: FootballPlayer;
  /** His share of his club's penalties, free kicks and corners added together,
   *  so 0 to 3. Null when the sister repo has no set-piece file for his club —
   *  which is not the same as taking none. */
  setPieceShare: number | null;
}

/** Ninety minutes, below which a per-ninety rate is arithmetic rather than
 *  evidence. One full match is the least that can be divided by ninety without
 *  the answer being about one substitute appearance; a man under it is rated on
 *  nothing at all, which is a dash and not a one. */
const MINUTES_FLOOR = 90;

/** CM's own scale. Ratings run 1 to 20 inclusive, so a percentile spreads over
 *  the nineteen steps between them. */
const BEST = 20;
const WORST = 1;

interface Measure {
  name: string;
  from: string;
  /** His figure, or null when the statistic does not apply to him. */
  of: (man: Scouted) => number | null;
}

const per90 = (total: (man: Scouted) => number) => (man: Scouted) => {
  const minutes = man.player.season.minutes;
  return minutes > 0 ? (total(man) * 90) / minutes : null;
};

/** The grid, in CM's own three-column reading order.
 *
 *  Each name is CM's word for the idea, not a paraphrase — and twice it is
 *  literally FPL's word too. FPL publishes `influence` and `creativity` under
 *  the names Championship Manager gave the same two ideas in 1999, which is the
 *  single luckiest thing about this screen. */
const MEASURES: readonly Measure[] = [
  { name: "Finishing", from: "goals against expected goals", of: finishing },
  { name: "Off The Ball", from: "expected goals per 90", of: per90((m) => m.player.season.expectedGoals) },
  { name: "Passing", from: "expected assists per 90", of: per90((m) => m.player.season.expectedAssists) },
  { name: "Creativity", from: "FPL's Creativity per 90", of: per90((m) => m.player.season.creativity) },
  { name: "Long Shots", from: "FPL's Threat per 90", of: per90((m) => m.player.season.threat) },
  { name: "Influence", from: "FPL's Influence per 90", of: per90((m) => m.player.season.influence) },
  { name: "Tackling", from: "tackles per 90", of: per90((m) => m.player.season.tackles) },
  {
    name: "Marking",
    from: "clearances, blocks and interceptions per 90",
    of: per90((m) => m.player.season.clearancesBlocksInterceptions),
  },
  { name: "Anticipation", from: "recoveries per 90", of: per90((m) => m.player.season.recoveries) },
  { name: "Work Rate", from: "tackles, blocks and recoveries per 90", of: per90(defensiveWork) },
  { name: "Handling", from: "saves per 90", of: per90((m) => m.player.season.saves) },
  { name: "Reflexes", from: "saves against expected goals conceded", of: reflexes },
  { name: "Determination", from: "FPL's bonus-points score per 90", of: per90((m) => m.player.season.bps) },
  { name: "Stamina", from: "minutes per start", of: stamina },
  { name: "Set Pieces", from: "share of his club's set pieces", of: (m) => m.setPieceShare },
];

/** His grid, rated against the league.
 *
 *  Pure: the cohort is passed in rather than fetched, and nothing here reads a
 *  clock. The cohort is filtered to men who have played, because ranking a
 *  regular against six hundred rows of nought puts everyone who has kicked a
 *  ball in the top decile of everything. */
export function attributes(man: Scouted, league: readonly Scouted[]): Attribute[] {
  const cohort = league.filter((other) => other.player.season.minutes >= MINUTES_FLOOR);
  const played = man.player.season.minutes >= MINUTES_FLOOR;
  return MEASURES.map((measure) => ({
    name: measure.name,
    from: measure.from,
    rating: played ? rate(measure, man, cohort) : null,
  }));
}

/** Where he sits in the league on one measure, as a 1–20: the fraction of the
 *  cohort he is strictly better than.
 *
 *  **Strictly better than, and not the midpoint of his tie.** The midpoint is
 *  the textbook percentile and it is wrong for this data, because most of these
 *  measures are nought for most of the division. Counted on 4 Sep 2026: of the
 *  225 men past the minutes floor, **203 have made no saves** — so the midrank
 *  of the zero block is 0.451, and every outfielder in the league came out at
 *  Handling 10. Maguire, a centre-half, was rated a better handler than a fifth
 *  of the goalkeepers.
 *
 *  Counting only those strictly below puts that whole block at 1, which is both
 *  true and what Championship Manager draws — Michael Ball is Handling 1
 *  (`cm9900/11.jpg`). Ties still share a rating, which is the property that
 *  matters: nobody is separated from an equal by their order in the array. */
function rate(measure: Measure, man: Scouted, cohort: readonly Scouted[]): number | null {
  const his = measure.of(man);
  if (his === null) return null;
  const theirs = cohort.map(measure.of).filter((value): value is number => value !== null);
  if (theirs.length === 0) return null;
  const below = theirs.filter((value) => value < his).length;
  return WORST + Math.round((below / theirs.length) * (BEST - WORST));
}

/** Goals against the chances he had. A man who scores his expected goals sits in
 *  the middle; the rating is the gap, not the goals, so a striker on twenty from
 *  twenty-two expected does not out-rank a winger on five from two. */
function finishing(man: Scouted): number | null {
  const { goals, expectedGoals, minutes } = man.player.season;
  if (minutes === 0) return null;
  return ((goals - expectedGoals) * 90) / minutes;
}

/** Saves against the goals he was expected to concede. A keeper behind a good
 *  defence makes few saves and this is what separates him from a bad one.
 *
 *  An outfielder comes out at nought rather than at null, deliberately: he has
 *  been measured and the measurement is none, which is the bottom of the scale
 *  and not an absence. CM agrees — Michael Ball is Reflexes 4, not blank. */
function reflexes(man: Scouted): number | null {
  const { saves, expectedGoalsConceded } = man.player.season;
  if (expectedGoalsConceded <= 0) return null;
  return saves / expectedGoalsConceded;
}

function defensiveWork(man: Scouted): number {
  const { tackles, clearancesBlocksInterceptions, recoveries } = man.player.season;
  return tackles + clearancesBlocksInterceptions + recoveries;
}

/** How much of a match he is on the pitch for when he starts it. A substitute
 *  has minutes and no start, so he is measured on nothing here rather than on a
 *  division by nought. */
function stamina(man: Scouted): number | null {
  const { minutes, starts } = man.player.season;
  return starts > 0 ? minutes / starts : null;
}

/** The two measures that are only a goalkeeper's, and the ones that are only an
 *  outfielder's.
 *
 *  **The split is Craig's, 4 Sep 2026** — *"give keepers their own stats,
 *  outfielders for the rest"* — and it reverses a decision this file used to
 *  defend in its own header. That paragraph argued a keeper handled himself: an
 *  outfielder makes no saves, sits at the bottom of Handling, and CM draws
 *  Michael Ball at Handling 1. True, and it produced a grid where two of fifteen
 *  rows were dead for 600 of 651 men and thirteen were dead for the other 51.
 *
 *  **Names, not a filter, because this layer has no position.** Deciding whether
 *  a man is a keeper needs a position, and the football layer refuses to hold one
 *  (`types.ts`) — FPL publishes only its own fantasy classification. So core owns
 *  the vocabulary and the app, which has the sister repo's real position, owns
 *  the choosing. */
export const KEEPER_ONLY: readonly string[] = ["Handling", "Reflexes"];

/** What a keeper is not rated on. Everything about scoring, creating and
 *  defending in open play — a keeper ranked against outfielders on Finishing is
 *  a row that says nothing except that he is a goalkeeper. */
export const OUTFIELD_ONLY: readonly string[] = [
  "Finishing",
  "Off The Ball",
  "Long Shots",
  "Creativity",
  "Marking",
  "Tackling",
  "Work Rate",
];
