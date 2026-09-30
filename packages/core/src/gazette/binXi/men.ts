import type { FootballPlayer, PlayerMatchStats } from "../../football/types";
import type { PlayerStatLine } from "../../league/fantrax/playerStats";
import type { BinExtras } from "./brief";
import type { BinMan } from "./select";

// The join behind the Bin XI: Fantrax's points and position for each free agent, his football from
// FPL through the bridge, and his shots and chances from the stats league. Never a name match.

/** One man's matches in the window, from FPL's per-fixture rows. */
export interface FplWeek {
  minutes: number;
  started: boolean;
  goals: number;
  assists: number;
  saves: number;
  expectedGoals: number;
  expectedAssists: number;
  cleanSheet: boolean;
}

/** Each FPL player's week over the fixtures `inWindow` keeps; a row for a match he missed adds nothing. */
export function fplWeeks(rows: readonly PlayerMatchStats[], inWindow: (fixtureId: number) => boolean): Map<number, FplWeek> {
  const weeks = new Map<number, FplWeek>();
  for (const row of rows) {
    if (!inWindow(row.fixtureId) || row.minutes === 0) continue;
    const week = weeks.get(row.playerId);
    weeks.set(row.playerId, {
      minutes: (week?.minutes ?? 0) + row.minutes,
      started: (week?.started ?? false) || row.starts > 0,
      goals: (week?.goals ?? 0) + row.goals,
      assists: (week?.assists ?? 0) + row.assists,
      saves: (week?.saves ?? 0) + row.saves,
      expectedGoals: (week?.expectedGoals ?? 0) + row.expectedGoals,
      expectedAssists: (week?.expectedAssists ?? 0) + row.expectedAssists,
      cleanSheet: (week?.cleanSheet ?? true) && row.cleanSheet,
    });
  }
  return weeks;
}

export interface BinPool {
  /** The served league's free agents over the window, with its points. */
  pool: readonly PlayerStatLine[];
  /** The stats league's lines over the same window, by Fantrax id. */
  sheet: ReadonlyMap<string, PlayerStatLine>;
  /** The footballer the bridge settled a Fantrax id on, or null. */
  player: (fantraxId: string) => FootballPlayer | null;
  weeks: ReadonlyMap<number, FplWeek>;
}

/** Every free agent who played in the window, and the ones who scored but could not be joined. */
export function binMen(input: BinPool): { men: BinMan[]; extras: Map<string, BinExtras>; unjoined: string[] } {
  const men: BinMan[] = [];
  const extras = new Map<string, BinExtras>();
  const unjoined: string[] = [];
  for (const line of input.pool) {
    if (line.points === null || line.defaultPosition === null) continue;
    const player = input.player(line.fantraxId);
    const week = player === null ? undefined : input.weeks.get(player.id);
    if (player === null || week === undefined) {
      if (line.points !== 0) unjoined.push(line.name);
      continue;
    }
    const stats = input.sheet.get(line.fantraxId)?.stats ?? {};
    men.push({
      fantraxId: line.fantraxId, code: player.code, name: line.name, clubId: player.clubId, position: line.defaultPosition,
      points: line.points, minutes: week.minutes, started: week.started, goals: week.goals, assists: week.assists,
      expectedGoals: week.expectedGoals, expectedAssists: week.expectedAssists,
      shots: stats.S ?? null, shotsOnTarget: stats.SOT ?? null, chancesCreated: stats.KP ?? null,
    });
    extras.set(line.fantraxId, {
      cleanSheet: week.cleanSheet, saves: week.saves, tacklesWon: stats.TkW ?? null, interceptions: stats.Int ?? null, clearances: stats.CLR ?? null,
    });
  }
  return { men, extras, unjoined };
}
