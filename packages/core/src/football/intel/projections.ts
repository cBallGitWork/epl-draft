import { finiteOrNull } from "../../untrusted";
import { byCode } from "./byCode";
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
  /** The week's points by what earns them; null on an export that predates the split. */
  parts: Record<ProjectionPart, number | null> | null;
}

/** The categories a week's points split into, in the order a reader picks them. */
export const PROJECTION_PARTS = ["goals", "assists", "cleanSheets", "bonus", "saves", "defcon", "appearance"] as const;
type ProjectionPart = (typeof PROJECTION_PARTS)[number];

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
  return byCode(file?.players, (player) => {
    const gameweeks = (player.gameweeks ?? [])
      .filter((week) => Number.isInteger(week?.gw))
      .map((week) => ({
        ...week,
        points: finiteOrNull(week.points),
        low: finiteOrNull(week.low),
        high: finiteOrNull(week.high),
        minutes: finiteOrNull(week.minutes),
        start: finiteOrNull(week.start),
        parts: week.parts == null ? null : parts(week.parts),
      }));
    return { ...player, gameweeks };
  });
}

/** Any projection's run of weeks, in FPL points or a league's: what the helpers below read. */
interface PointsRun {
  gameweeks: readonly { gw: number; points: number | null }[];
}

/** His projection for each gameweek in the window, or null where the model has none. */
export function nextGameweeks<W extends { gw: number }>(player: { gameweeks: readonly W[] }, gameweeks: readonly number[]): (W | null)[] {
  return gameweeks.map((gw) => player.gameweeks.find((week) => week.gw === gw) ?? null);
}

/** The points over the window's rounds that have a reading; null when none does. */
export function projectedTotal(player: PointsRun, gameweeks: readonly number[]): number | null {
  const points = nextGameweeks(player, gameweeks).flatMap((week) => (week?.points == null ? [] : [week.points]));
  return points.length === 0 ? null : points.reduce((sum, value) => sum + value, 0);
}

/** One man's projected points in one gameweek, or null where the model has none. */
export function projectedPoints(players: ReadonlyMap<number, PointsRun>, code: number, gw: number): number | null {
  return players.get(code)?.gameweeks.find((week) => week.gw === gw)?.points ?? null;
}

/** His projected points one gameweek and their place among the cohort's readings for it. */
export interface ProjectedPlace {
  points: number;
  /** Ties share a place. */
  rank: number;
  /** How many in the cohort the model has a reading for that week. */
  of: number;
}

/** Where his week ranks among the cohort (codes, his included); null when the model has no reading for him. Pure. */
export function projectedPlace(
  code: number,
  cohort: readonly number[],
  players: ReadonlyMap<number, PointsRun>,
  gw: number,
): ProjectedPlace | null {
  const points = projectedPoints(players, code, gw);
  if (points === null) return null;
  const theirs = cohort.map((other) => projectedPoints(players, other, gw)).filter((figure): figure is number => figure !== null);
  return { points, rank: 1 + theirs.filter((figure) => figure > points).length, of: theirs.length };
}

function parts(raw: Record<string, unknown>): Record<ProjectionPart, number | null> {
  return Object.fromEntries(PROJECTION_PARTS.map((part) => [part, finiteOrNull(raw[part])])) as Record<ProjectionPart, number | null>;
}
