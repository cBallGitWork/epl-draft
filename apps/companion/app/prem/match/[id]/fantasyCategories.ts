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
  firstScored,
  type FantraxCategory,
  type LeagueScoring,
} from "@epl/core";
import type { LeagueDayLine } from "../../../scoringDay";

// The Fantasy panel: the scoring league's own counts in its categories, looked up by meaning.

/** One man the team sheet named, as the panel reads him. */
export interface FantasyMan {
  code: number;
  name: string;
  /** The scoring league's line for his day; undefined where it has none. */
  league: LeagueDayLine | undefined;
}

export interface Counted {
  code: number;
  name: string;
  count: number;
}

export interface FantasyBox {
  key: string;
  label: string;
  home: Counted[];
  away: Counted[];
}

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

/** Every box with somebody in it; none when the league did not answer. */
export function fantasyBoxes(sides: { home: FantasyMan[]; away: FantasyMan[] }, scoring: LeagueScoring | null): FantasyBox[] {
  if (scoring === null) return [];
  return PANEL.flatMap((options) => {
    const category = firstScored(scoring.categories, options);
    if (category === null) return [];
    const of = (man: FantasyMan) => man.league?.counts[category.short] ?? null;
    return [{ key: category.code, label: categoryFor(category.caption).label, home: counted(sides.home, of), away: counted(sides.away, of) }];
  }).filter((box) => box.home.length + box.away.length > 0);
}

/** One side's men in a box, most first. */
function counted(men: readonly FantasyMan[], of: (man: FantasyMan) => number | null): Counted[] {
  return men
    .flatMap((man) => {
      const count = of(man);
      return count === null || count <= 0 ? [] : [{ code: man.code, name: man.name, count }];
    })
    .sort((a, b) => b.count - a.count);
}
