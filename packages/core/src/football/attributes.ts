import type { Shot } from "./intel/shots";
import type { LineCount, Running, PlayerLine } from "./intel/lines";

// Championship Manager's attribute grid, for a real footballer.
//
// CM's attributes are Sports Interactive's, hand-authored and licensed, so every rating here is
// OURS: a 1–20 percentile of something we measure, per 90. A keeper is rated against keepers and
// an outfielder against every outfielder who plays (Craig, 30 Sep 2026), so a centre-half's
// Finishing is low, as CM's is. The sample is last season's when he played enough of it, else
// this season's; running exists only this season. Agility, Balance and Bravery get no row.

/** One attribute, as the grid draws it. */
export interface Attribute {
  /** Championship Manager's own label, spelled CM's way. */
  name: string;
  /** 1–20, or null when he has no reading. */
  rating: number | null;
  /** What it was derived from, for the row's title. */
  from: string;
}

/** One man's inputs. Null where he has not played enough to count, or the sister repo is silent. */
export interface Scouted {
  code: number;
  keeper: boolean;
  /** The season he is rated on. */
  line: PlayerLine | null;
  /** This season's running. */
  running: Running | null;
  /** His share of his club's penalties, 0 to 1. */
  penaltyShare: number | null;
  /** His share of its free kicks and corners added together, 0 to 2. */
  setPieceShare: number | null;
}

/** The minutes each season needs before a man counts as playing it. */
export interface Floors {
  last: number;
  now: number;
}

/** Last season when he played enough of it, else this one; null when neither. */
export function ratedLine(last: PlayerLine | undefined, now: PlayerLine | undefined, floors: Floors): PlayerLine | null {
  if (last !== undefined && last.minutes >= floors.last) return last;
  if (now !== undefined && now.minutes >= floors.now) return now;
  return null;
}

/** This season's running, once he has run enough of it to count. */
export function ratedRunning(now: PlayerLine | undefined, floors: Floors): Running | null {
  const running = now?.running ?? null;
  return running !== null && running.minutes >= floors.now ? running : null;
}

/** CM's own scale. */
const BEST = 20;
const WORST = 1;

interface Measure {
  name: string;
  from: string;
  /** Whose row it is. */
  for: "keeper" | "outfield" | "both";
  of: (man: Scouted) => number | null;
}

/** His counts added up, or null when any is missing. */
function total(line: PlayerLine, keys: readonly LineCount[]): number | null {
  let sum = 0;
  for (const key of keys) {
    const figure = line[key];
    if (figure === null) return null;
    sum += figure;
  }
  return sum;
}

/** Counts per 90 of his minutes. */
const per90 =
  (...keys: LineCount[]) =>
  (man: Scouted) => {
    const figure = man.line === null ? null : total(man.line, keys);
    return figure === null || man.line === null || man.line.minutes <= 0 ? null : (figure * 90) / man.line.minutes;
  };
/** FPL's figure per 90 of the minutes FPL covered. */
const fpl90 = (key: LineCount) => (man: Scouted) => {
  const figure = man.line?.[key] ?? null;
  return figure === null || man.line === null || man.line.fplMinutes <= 0 ? null : (figure * 90) / man.line.fplMinutes;
};
const ran90 = (key: "km" | "sprints") => (man: Scouted) =>
  man.running === null || man.running.minutes <= 0 ? null : (man.running[key] * 90) / man.running.minutes;

/** The grid, alphabetical down the columns as CM 01/02 sets it. */
const MEASURES: readonly Measure[] = [
  { name: "Acceleration", from: "sprints per 90, this season", for: "outfield", of: ran90("sprints") },
  { name: "Aggression", from: "fouls committed per 90", for: "outfield", of: per90("fouls") },
  { name: "Anticipation", from: "recoveries per 90", for: "both", of: per90("recoveries") },
  { name: "Consistency", from: "his average match rating in his worst quarter of starts", for: "both", of: consistency },
  { name: "Creativity", from: "chances created per 90", for: "outfield", of: per90("chancesCreated") },
  { name: "Crossing", from: "accurate crosses per 90", for: "outfield", of: per90("crosses") },
  { name: "Determination", from: "FPL's bonus-points score per 90", for: "both", of: fpl90("bps") },
  { name: "Dribbling", from: "successful dribbles per 90", for: "outfield", of: per90("dribbles") },
  { name: "Finishing", from: "expected goals on target per 90", for: "outfield", of: per90("xgot") },
  { name: "Handling", from: "share of the shots on target he faced that he saved", for: "keeper", of: saveShare },
  { name: "Heading", from: "aerial duels won per 90", for: "outfield", of: per90("aerialsWon") },
  { name: "Influence", from: "FPL's Influence per 90", for: "both", of: fpl90("influence") },
  { name: "Long Shots", from: "shots from outside the box per 90", for: "outfield", of: per90("outsideBox") },
  { name: "Marking", from: "clearances, blocks and interceptions per 90", for: "outfield", of: per90("clearances", "blocks", "interceptions") },
  { name: "Off The Ball", from: "touches in the opposition box per 90", for: "outfield", of: per90("boxTouches") },
  { name: "Pace", from: "top speed, this season", for: "outfield", of: (m) => m.running?.topSpeed ?? null },
  { name: "Passing", from: "passes into the final third per 90", for: "outfield", of: per90("finalThirdPasses") },
  { name: "Penalty Taking", from: "share of his club's penalties", for: "outfield", of: (m) => m.penaltyShare },
  { name: "Positioning", from: "expected goals conceded less goals conceded, per 90", for: "keeper", of: positioning },
  { name: "Reflexes", from: "goals prevented per 90", for: "keeper", of: per90("goalsPrevented") },
  { name: "Set Pieces", from: "share of his club's free kicks and corners", for: "outfield", of: (m) => m.setPieceShare },
  { name: "Stamina", from: "minutes per start", for: "outfield", of: stamina },
  { name: "Tackling", from: "tackles per 90", for: "outfield", of: per90("tackles") },
  { name: "Teamwork", from: "part in the build-up to shots per 90 (xGBuildup)", for: "both", of: per90("xgBuildup") },
  { name: "Work Rate", from: "distance covered per 90, this season", for: "outfield", of: ran90("km") },
];

const forRole = (keeper: boolean) => (measure: Measure) => measure.for === "both" || (measure.for === "keeper") === keeper;

/** His grid, rated against the men of his role in `cohort`. Pure. */
export function attributes(man: Scouted, cohort: readonly Scouted[]): Attribute[] {
  const peers = cohort.filter((other) => other.keeper === man.keeper);
  return MEASURES.filter(forRole(man.keeper)).map((measure) => ({
    name: measure.name,
    from: measure.from,
    rating: rate(measure, man, peers),
  }));
}

/** Every row of the grid: its name, what it is made of, and whose it is. */
export const ATTRIBUTE_ROWS: readonly Omit<Measure, "of">[] = MEASURES.map(({ name, from, for: role }) => ({ name, from, for: role }));

/** Where he sits on one measure as a 1–20: the share of the cohort he is STRICTLY better than, so a
 *  block of noughts sits at 1 rather than at the midpoint of its tie. */
function rate(measure: Measure, man: Scouted, cohort: readonly Scouted[]): number | null {
  const figure = measure.of(man);
  if (figure === null) return null;
  const theirs = cohort.map(measure.of).filter((value): value is number => value !== null);
  if (theirs.length === 0) return null;
  const below = theirs.filter((value) => value < figure).length;
  return WORST + Math.round((below / theirs.length) * (BEST - WORST));
}

/** Fewer rated starts than this have no worst quarter to speak of. */
const RATED_FLOOR = 4;

/** How good his bad days are: his mean rating over the worst quarter of his starts. */
function consistency(man: Scouted): number | null {
  const ratings = [...(man.line?.ratings ?? [])].sort((a, b) => a - b);
  if (ratings.length < RATED_FLOOR) return null;
  const worst = ratings.slice(0, Math.floor(ratings.length / 4));
  return worst.reduce((a, b) => a + b, 0) / worst.length;
}

function saveShare(man: Scouted): number | null {
  const line = man.line;
  if (line === null || line.saves === null || line.conceded === null || line.saves + line.conceded <= 0) return null;
  return line.saves / (line.saves + line.conceded);
}

function positioning(man: Scouted): number | null {
  const line = man.line;
  if (line === null || line.xgc === null || line.conceded === null || line.fplMinutes <= 0) return null;
  return ((line.xgc - line.conceded) * 90) / line.fplMinutes;
}

/** Minutes per start; a man who has only come off the bench is not measured. */
function stamina(man: Scouted): number | null {
  const line = man.line;
  return line === null || line.starts <= 0 ? null : line.minutes / line.starts;
}

/** One man's season on the sister repo's shot map. */
export interface ShotLine {
  struck: number;
  /** Shots he set up: Understat's last touch before somebody else's shot. */
  created: number;
  left: number;
  right: number;
}

/** His line on the shot map: his own shots, and how many he set up for others. */
export function shotLine(own: readonly Shot[], created: number): ShotLine {
  return {
    struck: own.length,
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
