import { PREDICTIONS } from "../../config";
import type { StoryFace } from "../face";
import { mean } from "../../mean";
import type { Availability } from "../../football/playerState";
import type { PickSide } from "./pick";

// One side of a tie as Lawro may know it: the squad, never the line-up. Nothing here reads a
// roster slot, so the brief says the same whatever the manager has arranged before the lock.

/** One finished gameweek of a man's, summed over a double. */
export interface RecentGame {
  gameweek: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  points: number;
}

/** One man in the squad, as the script joined him. No figure of his is ever printed. */
export interface SquadMan {
  name: string;
  club: string;
  /** League eligibility, e.g. ["F", "M"]; never the slot he is in. */
  positions: readonly string[];
  /** Sister-model points over the next few rounds: orders the men, never printed. */
  horizon: number | null;
  availability: Availability;
  /** This round's opponents, none a blank and two a double, each with its standing on the sister
   *  repo's ratings where it is among the three best or worst at what this man faces. */
  fixtures: readonly { opponent: string; home: boolean; standing: string | null }[];
  /** Mean ease rank of those opponents in his line's view, 1 the kindest; null when unrated. */
  ease: number | null;
  liverpool: boolean;
  /** His last games, oldest first, from FPL's live reads; empty when they are not held. */
  recent: readonly RecentGame[];
  /** His picture. "G" comes off his eligibility, never the private slot: a keeper is eligible nowhere else. */
  face: StoryFace;
}

/** Where a side stands and how it got there, from Fantrax's table and settled results. */
export interface SideForm {
  rank: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  last: { gameweek: number; result: "W" | "D" | "L"; opponent: string; pointsFor: number; pointsAgainst: number } | null;
  /** Oldest first, e.g. "WWL"; empty when Fantrax's record and ours disagree. */
  run: string;
}

export interface PredictionSide extends PickSide {
  name: string;
  /** Every man he holds, best first: the men a line about this tie can name. */
  squad: SquadMan[];
  keyMen: SquadMan[];
  best: SquadMan | null;
  /** Not fit, among the men who matter most, best first. */
  doubts: SquadMan[];
  /** The best man with one of the round's hardest fixtures for his line, and with one of the kindest. */
  hard: SquadMan | null;
  kind: SquadMan | null;
  backLine: SquadMan[];
  /** Men signed who arrive for this round, as the brief names them. */
  arrivals: readonly string[];
  form: SideForm | null;
}

export function predictionSide(input: {
  teamId: string;
  name: string;
  projected: number | null;
  men: readonly SquadMan[];
  /** How many clubs are rated: the hardest rank, and a blank's. */
  hardest: number;
  arrivals: readonly string[];
  form: SideForm | null;
  /** Men he wrote about in his last columns: no key man again unless something is new for him. */
  worn: ReadonlySet<string>;
}): PredictionSide {
  const ranked = [...input.men].sort(byMatter);
  const fresh = ranked.filter((man) => !input.worn.has(man.name) || news(man));
  const best = ranked[0]?.horizon == null ? null : ranked[0];
  const backLine = ranked.filter((man) => man.positions.some((position) => position === "G" || position === "D"));
  const rated = backLine.flatMap((man) => (man.ease === null ? [] : [man.ease]));
  return {
    teamId: input.teamId,
    name: input.name,
    squad: ranked,
    projected: input.projected,
    bestManDoubt: best !== null && isDoubt(best.availability),
    liverpool: ranked.filter((man) => man.liverpool).length,
    backLineEase: mean(rated),
    keyMen: fresh.slice(0, PREDICTIONS.keyMen),
    best,
    doubts: ranked.slice(0, PREDICTIONS.doubtDepth).filter((man) => man.availability.state !== "fit"),
    hard: ranked.find((man) => man.ease !== null && man.ease > input.hardest - PREDICTIONS.hardFixtures) ?? null,
    kind: ranked.find((man) => man.ease !== null && man.fixtures.length > 0 && man.ease <= PREDICTIONS.kindFixtures) ?? null,
    backLine,
    arrivals: input.arrivals,
    form: input.form,
  };
}

/** Out, or no better than an even chance by FPL's own figure. */
function isDoubt(availability: Availability): boolean {
  return availability.out || (availability.chance !== null && availability.chance <= PREDICTIONS.doubtChance);
}

/** Something new for him this week: a doubt, a blank, a double, or an opponent at an extreme. */
function news(man: SquadMan): boolean {
  return man.availability.state !== "fit" || man.fixtures.length !== 1 || man.fixtures.some((each) => each.standing !== null);
}

/** The men who matter most first; a man the model has no reading for last; then by name. */
function byMatter(a: SquadMan, b: SquadMan): number {
  if (a.horizon !== b.horizon) {
    if (a.horizon === null) return 1;
    if (b.horizon === null) return -1;
    return b.horizon - a.horizon;
  }
  return a.name.localeCompare(b.name);
}
