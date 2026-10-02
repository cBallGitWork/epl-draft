import { type BreakdownLine, type LineupDetail, type ScoringCategory, type SquadPlayerDetail, MINUTES, idsOf, isGoalkeeper } from "@epl/core";
import { everyone } from "./subs";
import { byFigure } from "../../../components/league/order";
import { DEFAULT_SIDE_SORT } from "./views";

/** What each man did, by `fantraxId` then the league's category code, as Fantrax states it. */
export type Counts = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** What Fantrax paid each man, by `fantraxId`, category by category. */
export type Breakdowns = Readonly<Record<string, readonly BreakdownLine[]>>;

/** The league's categories the Stats boards print: all but minutes played (Craig, 1 Oct 2026). */
export function boardCategories(categories: Record<string, ScoringCategory>): Record<string, ScoringCategory> {
  const minutes = idsOf(categories, [MINUTES]);
  return Object.fromEntries(Object.entries(categories).filter(([id]) => !minutes.has(id)));
}

/** One man's counts in Fantrax's own row order, and whether he keeps goal (keepers have their own rows). */
export interface ManCounts {
  keeper: boolean;
  counts: Readonly<Record<string, string>>;
}

/** The categories anybody has a count in, in the order Fantrax lists an outfielder's rows, then any only a
 *  keeper has; named by the league. */
export function sideColumns(
  categories: Readonly<Record<string, ScoringCategory>>,
  men: readonly ManCounts[],
): ScoringCategory[] {
  const named = new Map(Object.values(categories).map((category) => [category.code, category]));
  const order = new Set<string>();
  for (const man of [...men.filter((m) => !m.keeper), ...men.filter((m) => m.keeper)]) {
    for (const code of Object.keys(man.counts)) order.add(code);
  }
  return [...order].flatMap((code) => named.get(code) ?? []);
}

/** Both boards' columns, from every man on the sheets on screen. */
export function boardColumns(
  categories: Readonly<Record<string, ScoringCategory>>,
  sheets: Iterable<LineupDetail>,
  counts: Counts,
): ScoringCategory[] {
  return sideColumns(
    categories,
    [...sheets].flatMap(everyone).map((man) => ({
      keeper: isGoalkeeper(man.rostered.slot.position),
      counts: counts[man.rostered.slot.fantraxId] ?? {},
    })),
  );
}

/** One man's figure in a column: Fantrax's total under `Pts`, else his count; null where there is no reading. */
export function figureOf(player: SquadPlayerDetail, head: string, counts: Counts): number | null {
  if (head === DEFAULT_SIDE_SORT) return player.points ?? null;
  const value = counts[player.rostered.slot.fantraxId]?.[head];
  const number = value === undefined ? NaN : Number(value);
  return Number.isFinite(number) ? number : null;
}

/** What Fantrax paid him in one category this gameweek, signed: the figure's gain or loss. Nought where it paid nothing. */
export function paidIn(breakdown: Breakdowns, player: SquadPlayerDetail, code: string): number {
  if (code === DEFAULT_SIDE_SORT) return player.points ?? 0;
  return breakdown[player.rostered.slot.fantraxId]?.find((line) => line.code === code)?.points ?? 0;
}

/** The eleven and the bench, each ordered by one column; ties keep the sheet's order, absences sink. */
export function sideRows(
  sheet: LineupDetail,
  counts: Counts,
  sort: { head: string; descending: boolean },
): { eleven: SquadPlayerDetail[]; bench: SquadPlayerDetail[] } {
  const order = (players: readonly SquadPlayerDetail[]) =>
    [...players].sort((a, b) =>
      byFigure(figureOf(a, sort.head, counts), figureOf(b, sort.head, counts), sort.descending),
    );
  return { eleven: order(sheet.rows.flatMap((line) => line.players)), bench: order(sheet.bench) };
}
