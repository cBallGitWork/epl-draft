import { LEAGUE_PROJECTION_PARTS, mean, nextGameweeks, type LeagueProjection, type LeagueProjectionPart } from "@epl/core";
import { byFigure } from "../../components/league/order";
import type { Held } from "../holder";
import type { PoolRow } from "../pool";

// The Projections board's rows: the sister model's projection in our league's points for each gameweek in the window,
// a total and the minutes it expects, joined to our league's view of the man. A week with no reading is a dash.

/** Who a projected man is on our side: his names, his Fantrax page, eligibility and holder when the pool has him. */
export interface Known extends Held {
  name: string;
  fullName: string;
  fantraxId: string | null;
  positions: readonly string[];
}

/** Every man FPL lists, by code: FPL's short name, and the pool's full name, page, eligibility and holder. */
export function knownMen(players: readonly { code: number; name: string }[], pool: readonly PoolRow[]): Map<number, Known> {
  const byCode = new Map(pool.flatMap((row) => (row.fplCode === null ? [] : [[row.fplCode, row] as const])));
  return new Map(
    players.map((player) => {
      const entry = byCode.get(player.code)?.entry;
      return [
        player.code,
        {
          name: player.name,
          fullName: entry?.player.displayName ?? player.name,
          fantraxId: entry?.player.fantraxId ?? null,
          positions: entry?.eligiblePositions ?? [],
          ownerTeamId: entry?.ownerTeamId ?? null,
          status: entry?.status ?? "",
        },
      ];
    }),
  );
}

export interface ProjectionRow extends Known {
  code: number;
  club: string;
  weeks: (number | null)[];
  total: number | null;
  minutes: number | null;
}

/** What the week columns show: every point, or the points one category earns. */
export type ProjectionCategory = "points" | LeagueProjectionPart;

export const PROJECTION_CATEGORIES: readonly { value: ProjectionCategory; label: string }[] = [
  { value: "points", label: "All points" },
  { value: "goals", label: "Goals" },
  { value: "assists", label: "Assists" },
  { value: "cleanSheets", label: "Clean sheets" },
  { value: "appearance", label: "Appearance" },
  { value: "conceded", label: "Deductions" },
  { value: "defcon", label: "DefCon" },
  { value: "keeper", label: "Keeper points" },
];

/** The category a URL asked for, or every point. */
export function projectionCategory(asked: string | undefined): ProjectionCategory {
  return (LEAGUE_PROJECTION_PARTS as readonly string[]).includes(asked ?? "") ? (asked as LeagueProjectionPart) : "points";
}

/** Every projected man we can name, over the window, in one category. A man neither FPL nor the pool names is left
 *  out; a week the model has no reading for is a dash. */
export function projectionRows(
  players: ReadonlyMap<number, LeagueProjection>,
  gameweeks: readonly number[],
  known: ReadonlyMap<number, Known>,
  category: ProjectionCategory = "points",
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  for (const player of players.values()) {
    const who = known.get(player.code);
    if (who === undefined) continue;
    const weeks = nextGameweeks(player, gameweeks);
    const figures = weeks.map((week) => (week === null ? null : category === "points" ? week.points : week.parts[category]));
    const read = figures.filter((figure): figure is number => figure !== null);
    const minutes = mean(weeks.flatMap((week) => (week?.minutes == null ? [] : [week.minutes])));
    rows.push({
      ...who,
      code: player.code,
      club: player.club,
      weeks: figures,
      total: read.length === 0 ? null : read.reduce((a, b) => a + b, 0),
      minutes: minutes === null ? null : Math.round(minutes),
    });
  }
  return rows;
}

/** A sort key: `tot`, `xmins`, or `gw` and a gameweek in the window. */
export type ProjectionSort = string;

const DEFAULT_PROJECTION_SORT = "tot";

/** The figure a key reads off a row; a gameweek the window no longer holds falls back to the total. */
export function projectionFigure(row: ProjectionRow, key: ProjectionSort, gameweeks: readonly number[]): number | null {
  if (key === "xmins") return row.minutes;
  const at = key.startsWith("gw") ? gameweeks.indexOf(Number(key.slice(2))) : -1;
  return at === -1 ? row.total : row.weeks[at];
}

/** The key a URL asked for, or the total when the window has no such column. */
export function projectionSort(asked: string | undefined, gameweeks: readonly number[]): ProjectionSort {
  if (asked === "xmins" || asked === "tot") return asked;
  if (asked?.startsWith("gw") && gameweeks.includes(Number(asked.slice(2)))) return asked;
  return DEFAULT_PROJECTION_SORT;
}

/** Ordered by one figure; an absent one sinks either way, and a tie falls to the total, then the name. */
export function sortedProjections(
  rows: readonly ProjectionRow[],
  key: ProjectionSort,
  gameweeks: readonly number[],
  descending: boolean,
): ProjectionRow[] {
  return [...rows].sort(
    (a, b) =>
      byFigure(projectionFigure(a, key, gameweeks), projectionFigure(b, key, gameweeks), descending) ||
      (b.total ?? -Infinity) - (a.total ?? -Infinity) ||
      a.name.localeCompare(b.name),
  );
}
