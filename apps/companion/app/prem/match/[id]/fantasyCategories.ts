import {
  ASSIST,
  GOALS,
  KEEPER_WORK,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  YELLOW_CARDS,
  byPositionDepth,
  defConAt,
  firstScored,
  fplDefConAt,
  wordsFor,
  type FantraxCategory,
  type LeagueScoring,
} from "@epl/core";
import type { LeagueDayLine } from "../../../scoringDay";

// The Fantasy panel: the scoring league's own counts in its categories, looked up by meaning, then FPL's DefCon apart.

/** One man the team sheet named, as the panel reads him. */
export interface FantasyMan {
  code: number;
  name: string;
  /** The position the team sheet named him in. */
  named: string | null;
  /** The scoring league's line for his day; undefined where it has none. */
  league: LeagueDayLine | undefined;
  /** FPL's defensive contribution in this match; undefined where FPL has no line for him. */
  fplDefCon: number | undefined;
}

export interface Counted {
  code: number;
  name: string;
  count: number;
}

/** One position's men in a box, or every man where the box is not divided (`position` null). */
interface FantasyPart {
  position: string | null;
  home: Counted[];
  away: Counted[];
}

interface FantasyBox {
  key: string;
  label: string;
  parts: FantasyPart[];
}

/** A man's count in a box, the least that lists him, and the mark he is ranked against; null where the box says nothing of him. */
type Reading = (man: FantasyMan) => { count: number | null; from: number; mark: number } | null;

/** The letter a box divides its men by, for a box whose marks differ by position. */
type Divide = (man: FantasyMan) => string | null;

/** The league's categories the panel lists, each the first of its options the league scores. */
const PANEL: readonly (readonly FantraxCategory[])[] = [
  [GOALS],
  ASSIST,
  KEEPER_WORK,
  [PENALTY_SAVES],
  [PENALTIES_MISSED],
  [OWN_GOALS],
  [YELLOW_CARDS],
  [RED_CARDS],
];

/** Every box with somebody in it: ours when the league answered, then FPL's DefCon, which is never ours. */
export function fantasyBoxes(sides: { home: FantasyMan[]; away: FantasyMan[] }, scoring: LeagueScoring | null): FantasyBox[] {
  const boxes: { key: string; label: string; of: Reading; by?: Divide }[] = [];
  if (scoring !== null) {
    for (const options of PANEL) {
      const category = firstScored(scoring.categories, options);
      if (category === null) continue;
      const of: Reading = (man) => (man.league === undefined ? null : { count: man.league.counts[category.short] ?? null, from: 1, mark: 1 });
      boxes.push({ key: category.code, label: wordsFor(category).name, of });
    }
    boxes.push({ key: "defcon", label: "DefCon", of: (man) => ourDefCon(scoring, man), by: (man) => man.league?.position ?? null });
  }
  boxes.push({ key: "fpl-defcon", label: "FPL DefCon", of: fplDefCon, by: (man) => man.named });
  return boxes
    .map(({ key, label, of, by }) => ({ key, label, parts: parts(sides, of, by) }))
    .filter((box) => box.parts.length > 0);
}

/** A box's men by position, back to front (Craig, 8 Oct 2026: DefCon "needs to show who is mid/def/forward"), or all
 *  together where the box is not divided; a part with nobody in it is dropped. */
function parts(sides: { home: FantasyMan[]; away: FantasyMan[] }, of: Reading, by: Divide | undefined): FantasyPart[] {
  const at = (position: string | null) => (man: FantasyMan) => by === undefined || by(man) === position;
  const positions = by === undefined ? [null] : [...new Set([...sides.home, ...sides.away].flatMap((man) => by(man) ?? []))].sort(byPositionDepth);
  return positions
    .map((position) => ({
      position,
      home: counted(sides.home.filter(at(position)), of),
      away: counted(sides.away.filter(at(position)), of),
    }))
    .filter((part) => part.home.length + part.away.length > 0);
}

/** His DefCon at the letter his points are priced at, from the count at which he is close (Craig, 1 Oct 2026). */
function ourDefCon(scoring: LeagueScoring, man: FantasyMan): ReturnType<Reading> {
  const line = man.league;
  const at = line === undefined || line.position === null ? null : defConAt(scoring, line.position);
  return line === undefined || at === null ? null : { count: line.counts[at.short] ?? null, from: Math.max(1, at.close), mark: at.mark };
}

function fplDefCon(man: FantasyMan): ReturnType<Reading> {
  const at = fplDefConAt(man.named);
  return at === null || man.fplDefCon === undefined ? null : { count: man.fplDefCon, from: Math.max(1, at.close), mark: at.mark };
}

/** One side's men in one part of a box, nearest their mark first. */
function counted(men: readonly FantasyMan[], of: Reading): Counted[] {
  return men
    .flatMap((man) => {
      const reading = of(man);
      if (reading === null || reading.count === null || reading.count < reading.from) return [];
      return [{ code: man.code, name: man.name, count: reading.count, rank: reading.count / reading.mark }];
    })
    .sort((a, b) => b.rank - a.rank || b.count - a.count)
    .map(({ code, name, count }) => ({ code, name, count }));
}
