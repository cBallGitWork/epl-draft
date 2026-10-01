import { isGoalkeeper, positionDepth } from "../../join/lineup";
import type { Formation } from "../../league/formations";

// The best eleven nobody in the league has, in a shape the league allows, and the bench of men who
// did most without scoring. Points pick the side; the chances a man made or missed move the close calls.

/** One unowned man's week, joined by the desk. Stats the reads did not carry are null, never nought. */
export interface BinMan {
  fantraxId: string;
  /** FPL's season-stable code: the face on the pitch. */
  code: number;
  name: string;
  clubId: number;
  /** The position his points are priced at: his default, since a free agent has no slot. */
  position: string;
  /** Fantrax's, this period. */
  points: number;
  minutes: number;
  started: boolean;
  goals: number;
  assists: number;
  expectedGoals: number;
  expectedAssists: number;
  shots: number | null;
  shotsOnTarget: number | null;
  chancesCreated: number | null;
}

/** What a goal and an assist are worth at a position, under the league's own scoring. */
export type Worth = (position: string) => { goal: number; assist: number } | null;

export interface BinXi {
  /** "4-4-2", back to front, keeper left out. */
  shape: string;
  /** Keeper first, then each line. */
  xi: BinMan[];
  bench: BinMan[];
  /** The eleven's Fantrax points. */
  total: number;
}

/** Goals and assists the chances were worth, less the ones he took: positive is unlucky. */
export function owed(man: BinMan, worth: Worth): number {
  const value = worth(man.position);
  if (value === null) return 0;
  return (man.expectedGoals - man.goals) * value.goal + (man.expectedAssists - man.assists) * value.assist;
}

/** Null when no allowed shape can be filled from men who started. */
export function binXi(
  men: readonly BinMan[],
  shapes: readonly Formation[],
  worth: Worth,
  reserves: number | null,
  luck: number,
): BinXi | null {
  const rank = (man: BinMan) => man.points + luck * owed(man, worth);
  const order = (a: BinMan, b: BinMan) =>
    rank(b) - rank(a) || b.points - a.points || involvement(b) - involvement(a) || b.minutes - a.minutes || a.name.localeCompare(b.name);
  const starters = men.filter((man) => man.started).sort(order);

  let best: { shape: Formation; xi: BinMan[]; rank: number; points: number } | null = null;
  for (const shape of shapes) {
    const xi = Object.keys(shape)
      .sort((a, b) => positionDepth(a) - positionDepth(b))
      .flatMap((position) => starters.filter((man) => man.position === position).slice(0, shape[position]));
    if (xi.length !== Object.values(shape).reduce((sum, count) => sum + count, 0)) continue;
    const ranked = xi.reduce((sum, man) => sum + rank(man), 0);
    const points = xi.reduce((sum, man) => sum + man.points, 0);
    if (best === null || ranked > best.rank || (ranked === best.rank && points > best.points)) best = { shape, xi, rank: ranked, points };
  }
  if (best === null) return null;

  const picked = new Set(best.xi.map((man) => man.fantraxId));
  const bench = men
    .filter((man) => !picked.has(man.fantraxId) && man.minutes > 0 && owed(man, worth) > 0)
    .sort((a, b) => owed(b, worth) - owed(a, worth) || involvement(b) - involvement(a) || a.name.localeCompare(b.name))
    .slice(0, reserves ?? 0);

  const outfield = Object.keys(best.shape).filter((position) => !isGoalkeeper(position)).sort((a, b) => positionDepth(a) - positionDepth(b));
  return { shape: outfield.map((position) => best.shape[position]).join("-"), xi: best.xi, bench, total: best.points };
}

/** Shots and chances made: who was in the game, when points cannot separate two men. */
function involvement(man: BinMan): number {
  return (man.shots ?? 0) + (man.chancesCreated ?? 0);
}
