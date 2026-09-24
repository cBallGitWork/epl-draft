import { PREDICTIONS } from "../../config";
import type { Availability } from "../../football/playerState";
import type { PickSide } from "./pick";

// One side of a tie as Lawro may know it: the squad, never the line-up. Nothing here reads a
// roster slot, so the brief says the same whatever the manager has arranged before the lock.

/** One man in the squad, as the script joined him. No figure of his is ever printed. */
export interface SquadMan {
  name: string;
  club: string;
  /** League eligibility, e.g. ["F", "M"]; never the slot he is in. */
  positions: readonly string[];
  /** Sister-model points over the next few rounds: orders the men, never printed. */
  horizon: number | null;
  availability: Availability;
  /** This round's opponents: none is a blank, two a double. */
  fixtures: readonly { opponent: string; home: boolean }[];
  /** Mean ease rank of those opponents in his line's view, 1 the kindest; null when unrated. */
  ease: number | null;
  liverpool: boolean;
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
  keyMen: SquadMan[];
  best: SquadMan | null;
  /** Not fit, among the men who matter most, best first. */
  doubts: SquadMan[];
  /** The best man with one of the round's hardest fixtures for his line. */
  hard: SquadMan | null;
  liverpoolMen: string[];
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
}): PredictionSide {
  const ranked = [...input.men].sort(byMatter);
  const best = ranked[0]?.horizon == null ? null : ranked[0];
  const liverpoolMen = ranked.filter((man) => man.liverpool).map((man) => man.name);
  const backLine = ranked.filter((man) => man.positions.some((position) => position === "G" || position === "D"));
  const rated = backLine.flatMap((man) => (man.ease === null ? [] : [man.ease]));
  return {
    teamId: input.teamId,
    name: input.name,
    projected: input.projected,
    bestManDoubt: best !== null && isDoubt(best.availability),
    liverpool: liverpoolMen.length,
    backLineEase: rated.length === 0 ? null : rated.reduce((sum, ease) => sum + ease, 0) / rated.length,
    keyMen: ranked.slice(0, PREDICTIONS.keyMen),
    best,
    doubts: ranked.slice(0, PREDICTIONS.doubtDepth).filter((man) => man.availability.state !== "fit"),
    hard: ranked.find((man) => man.ease !== null && man.ease > input.hardest - PREDICTIONS.hardFixtures) ?? null,
    liverpoolMen,
    backLine,
    arrivals: input.arrivals,
    form: input.form,
  };
}

/** Out, or no better than an even chance by FPL's own figure. */
function isDoubt(availability: Availability): boolean {
  return availability.out || (availability.chance !== null && availability.chance <= PREDICTIONS.doubtChance);
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
