import type { Shot } from "./intel/shots";
import type { StatKey } from "./intel/statKeys";
import { per90 as countPer90, type StatsRow } from "./intel/stats";
import type { FootballPlayer } from "./types";

// Championship Manager's attribute grid, for a real footballer.
//
// CM's attributes are Sports Interactive's, hand-authored and licensed, so every rating here is
// OURS: a 1–20 percentile of something we measure, within the cohort the caller passes. Since
// 25 Sep 2026 that is his position group (Craig: "compare to just attackers, defenders to just
// defenders"), so a centre-half's Finishing says how he finishes for a centre-half.
//
// What nothing we hold measures gets NO ROW: Pace, Acceleration, Agility, Balance, Bravery.
// A rating is a ranking in THIS season, so it is thin early and settles as the season fills.
// Since 26 Sep 2026 the event counts (tackles won, aerials, crosses) are the stats league's.

/** One attribute, as the grid draws it. */
export interface Attribute {
  /** Championship Manager's own label, spelled CM's way. */
  name: string;
  /** 1–20, or null when he has not played enough for the rate to mean anything. */
  rating: number | null;
  /** What it was derived from, for the row's title. */
  from: string;
}

/** One man's season on the sister repo's shot map. */
export interface ShotLine {
  struck: number;
  headers: number;
  outsideBox: number;
  /** Shots he set up: Understat's last touch before somebody else's shot. */
  created: number;
  left: number;
  right: number;
}

/** One man's inputs. Everything past `player` is the sister repo's, so each is null where it is silent. */
export interface Scouted {
  player: FootballPlayer;
  /** His share of his club's penalties, 0 to 1. */
  penaltyShare: number | null;
  /** His share of its free kicks and corners added together, 0 to 2. */
  setPieceShare: number | null;
  shots: ShotLine | null;
  touches: number | null;
  /** His counts off the stats league, or null where it holds none. */
  stats: StatsRow | null;
}

/** Whose grid a row belongs to; a row with none is on both. */
export type Role = "keeper" | "outfield";

/** Ninety minutes, below which a per-ninety rate is arithmetic rather than evidence. */
const MINUTES_FLOOR = 90;

/** CM's own scale. */
const BEST = 20;
const WORST = 1;

interface Measure {
  name: string;
  from: string;
  for?: Role;
  /** His figure, or null when the statistic does not apply to him. */
  of: (man: Scouted) => number | null;
}

const per90 = (total: (man: Scouted) => number | null) => (man: Scouted) => {
  const minutes = man.player.season.minutes;
  const figure = total(man);
  return minutes > 0 && figure !== null ? (figure * 90) / minutes : null;
};

const season = (man: Scouted) => man.player.season;

/** Stats-league counts added up, per ninety of his minutes there; null where it holds none. */
const counted = (...keys: StatKey[]) => (man: Scouted) => {
  const rates = keys.map((key) => countPer90(man.stats ?? undefined, key));
  return rates.some((rate) => rate === null) ? null : rates.reduce((sum: number, rate) => sum + (rate ?? 0), 0);
};

/** The grid, alphabetical down the columns as CM 01/02 sets it. */
const MEASURES: readonly Measure[] = [
  { name: "Aggression", from: "fouls committed per 90", for: "outfield", of: counted("foulsCommitted") },
  { name: "Anticipation", from: "recoveries per 90", of: per90((m) => season(m).recoveries) },
  { name: "Creativity", from: "key passes per 90", for: "outfield", of: counted("keyPasses") },
  { name: "Crossing", from: "accurate crosses per 90", for: "outfield", of: counted("accurateCrosses") },
  { name: "Determination", from: "FPL's bonus-points score per 90", of: per90((m) => season(m).bps) },
  { name: "Dribbling", from: "take-ons attempted per 90", for: "outfield", of: counted("contestsAttempted") },
  { name: "Finishing", from: "goals against expected goals per 90", for: "outfield", of: per90((m) => season(m).goals - season(m).expectedGoals) },
  { name: "Handling", from: "saves per 90", for: "keeper", of: per90((m) => season(m).saves) },
  { name: "Heading", from: "aerial duels won per 90", for: "outfield", of: counted("aerialsWon") },
  { name: "Influence", from: "FPL's Influence per 90", of: per90((m) => season(m).influence) },
  { name: "Long Shots", from: "shots from outside the box per 90, off the shot map", for: "outfield", of: per90((m) => m.shots?.outsideBox ?? null) },
  { name: "Marking", from: "clearances per 90", for: "outfield", of: counted("clearances") },
  { name: "Off The Ball", from: "expected goals per 90", for: "outfield", of: per90((m) => season(m).expectedGoals) },
  { name: "Passing", from: "passes into the final third per 90", for: "outfield", of: counted("finalThirdPasses") },
  { name: "Penalty Taking", from: "share of his club's penalties", for: "outfield", of: (m) => m.penaltyShare },
  { name: "Positioning", from: "expected goals conceded less goals conceded, per 90", for: "keeper", of: per90((m) => season(m).expectedGoalsConceded - season(m).goalsConceded) },
  { name: "Positioning", from: "interceptions per 90", for: "outfield", of: counted("interceptions") },
  { name: "Reflexes", from: "saves against expected goals conceded", for: "keeper", of: reflexes },
  { name: "Set Pieces", from: "share of his club's free kicks and corners", for: "outfield", of: (m) => m.setPieceShare },
  { name: "Stamina", from: "minutes per start", for: "outfield", of: stamina },
  { name: "Tackling", from: "tackles won per 90", for: "outfield", of: counted("tacklesWon") },
  { name: "Teamwork", from: "touches per 90, off the touch map", of: per90((m) => m.touches) },
  { name: "Work Rate", from: "tackles won, interceptions and recoveries per 90", for: "outfield", of: counted("tacklesWon", "interceptions", "recoveries") },
];

/** His grid for his role, rated against `cohort`. Pure; the cohort is filtered to men past the minutes floor. */
export function attributes(man: Scouted, cohort: readonly Scouted[], role: Role): Attribute[] {
  const played = cohort.filter((other) => other.player.season.minutes >= MINUTES_FLOOR);
  const measured = man.player.season.minutes >= MINUTES_FLOOR;
  return MEASURES.filter((measure) => measure.for === undefined || measure.for === role).map((measure) => ({
    name: measure.name,
    from: measure.from,
    rating: measured ? rate(measure, man, played) : null,
  }));
}

/** Where he sits on one measure as a 1–20: the share of the cohort he is STRICTLY better than, so a
 *  block of noughts sits at 1 rather than at the midpoint of its tie. */
function rate(measure: Measure, man: Scouted, cohort: readonly Scouted[]): number | null {
  const his = measure.of(man);
  if (his === null) return null;
  const theirs = cohort.map(measure.of).filter((value): value is number => value !== null);
  if (theirs.length === 0) return null;
  const below = theirs.filter((value) => value < his).length;
  return WORST + Math.round((below / theirs.length) * (BEST - WORST));
}

/** Saves against the goals he was expected to concede; an outfielder is nought, not null. */
function reflexes(man: Scouted): number | null {
  const { saves, expectedGoalsConceded } = man.player.season;
  return expectedGoalsConceded > 0 ? saves / expectedGoalsConceded : null;
}

/** Minutes per start; a man who has only come off the bench is not measured. */
function stamina(man: Scouted): number | null {
  const { minutes, starts } = man.player.season;
  return starts > 0 ? minutes / starts : null;
}

/** The penalty area on the shot map's 0–100 axes: 16.5m deep of a 105m pitch, 40.3m wide of 68m. */
const BOX_FROM = 100 - (16.5 / 105) * 100;
const BOX_SIDE = (100 - (40.3 / 68) * 100) / 2;

/** His line on the shot map: his own shots, and how many he set up for others. */
export function shotLine(own: readonly Shot[], created: number): ShotLine {
  const inBox = (shot: Shot) => shot.x >= BOX_FROM && shot.y >= BOX_SIDE && shot.y <= 100 - BOX_SIDE;
  return {
    struck: own.length,
    headers: own.filter((shot) => shot.bodyPart === "head").length,
    outsideBox: own.filter((shot) => !inBox(shot)).length,
    created,
    left: own.filter((shot) => shot.bodyPart === "left-foot").length,
    right: own.filter((shot) => shot.bodyPart === "right-foot").length,
  };
}

/** Fewer footed shots than this say nothing about his foot. */
const FOOTED_FLOOR = 5;
/** A weaker foot taking this share of his footed shots makes him two-footed. */
const EITHER = 1 / 3;

/** CM's Preferred Foot, read off the feet he shoots with; null until he has shot enough. */
export function preferredFoot(line: ShotLine | null): "Right" | "Left" | "Either" | null {
  if (line === null) return null;
  const footed = line.left + line.right;
  if (footed < FOOTED_FLOOR) return null;
  if (Math.min(line.left, line.right) / footed >= EITHER) return "Either";
  return line.right > line.left ? "Right" : "Left";
}
