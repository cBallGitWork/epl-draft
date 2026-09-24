import type { IntelManifest } from "./types";

// The sister model's projected FPL points per player per gameweek: FPL's scoring, not Fantrax's.
// A round the model has no reading for is absent, never nought.

export interface ProjectedGameweek {
  gw: number;
  points: number | null;
  /** The model's band around `points`, exported but not drawn yet. */
  low: number | null;
  high: number | null;
  minutes: number | null;
  /** Chance he starts, 0–1. */
  start: number | null;
  fixtures: number;
}

export interface ProjectedPlayer {
  /** FPL's season-stable player code. */
  code: number;
  /** FPL's three-letter club label. */
  club: string;
  /** The sister model's role (`ST`, `CB` …), a football reading and not a fantasy position. */
  role: string;
  gameweeks: ProjectedGameweek[];
}

export interface IntelProjections {
  manifest: IntelManifest;
  players: ProjectedPlayer[];
}

/** Every projected player by code; a row with no code, or a gameweek with no number, is dropped. */
export function projectionIntel(file: IntelProjections | null): Map<number, ProjectedPlayer> {
  const byCode = new Map<number, ProjectedPlayer>();
  for (const player of file?.players ?? []) {
    if (!Number.isInteger(player?.code)) continue;
    const gameweeks = (player.gameweeks ?? [])
      .filter((week) => Number.isInteger(week?.gw))
      .map((week) => ({
        ...week,
        points: reading(week.points),
        low: reading(week.low),
        high: reading(week.high),
        minutes: reading(week.minutes),
        start: reading(week.start),
      }));
    byCode.set(player.code, { ...player, gameweeks });
  }
  return byCode;
}

/** His projection for each gameweek in the window, or null where the model has none. */
export function nextGameweeks(player: ProjectedPlayer, gameweeks: readonly number[]): (ProjectedGameweek | null)[] {
  return gameweeks.map((gw) => player.gameweeks.find((week) => week.gw === gw) ?? null);
}

/** The points over the window's rounds that have a reading; null when none does. */
export function projectedTotal(player: ProjectedPlayer, gameweeks: readonly number[]): number | null {
  const points = nextGameweeks(player, gameweeks).flatMap((week) => (week?.points == null ? [] : [week.points]));
  return points.length === 0 ? null : points.reduce((sum, value) => sum + value, 0);
}

function reading(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
