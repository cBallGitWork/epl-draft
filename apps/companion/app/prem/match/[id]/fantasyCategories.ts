import {
  ASSIST,
  GOALS,
  KEEPER_WORK,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  YELLOW_CARDS,
  categoryFor,
  defConAt,
  firstScored,
  fplDefConAt,
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

interface FantasyBox {
  key: string;
  label: string;
  home: Counted[];
  away: Counted[];
}

/** A man's count in a box, the least that lists him, and the mark he is ranked against; null where the box says nothing of him. */
type Reading = (man: FantasyMan) => { count: number | null; from: number; mark: number } | null;

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
  const boxes: { key: string; label: string; of: Reading }[] = [];
  if (scoring !== null) {
    for (const options of PANEL) {
      const category = firstScored(scoring.categories, options);
      if (category === null) continue;
      const of: Reading = (man) => (man.league === undefined ? null : { count: man.league.counts[category.short] ?? null, from: 1, mark: 1 });
      boxes.push({ key: category.code, label: categoryFor(category.caption).label, of });
    }
    boxes.push({ key: "defcon", label: "DefCon", of: (man) => ourDefCon(scoring, man) });
  }
  boxes.push({ key: "fpl-defcon", label: "FPL DefCon", of: fplDefCon });
  return boxes
    .map(({ key, label, of }) => ({ key, label, home: counted(sides.home, of), away: counted(sides.away, of) }))
    .filter((box) => box.home.length + box.away.length > 0);
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

/** One side's men in a box, nearest their mark first: a defender's 3 and a midfielder's 8 both reach the first band. */
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
