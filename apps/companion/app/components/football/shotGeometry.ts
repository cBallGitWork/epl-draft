import type { Shot } from "@epl/core";
import { toBoxY } from "./pitchBox";

// A shot mark's size, tier and reach, and where its key pass is drawn, in pitch units: pure, so tested.

/** What a mark is drawn from: where the shot was struck, the chance behind it and what became of it. */
type Mark = Pick<Shot, "x" | "y" | "xg" | "outcome">;

/** The cream edge every mark wears, so a club colour close to the grass still reads. */
export const HALO = 0.15;

/** Radius in pitch units: base plus a span scaled by √xG, capped at a penalty's 0.8; `plain` when xG is unknown. */
const MARK = { base: 0.7, span: 1.1, cap: 0.8, plain: 1.0 };

/** How each tier is drawn, in one place, so the key and the pitch cannot disagree. */
export const DRAWN = {
  goal: { fill: "var(--color-cream)", width: 0.45, opacity: 0.95 },
  target: { fill: "none", width: 0.45, opacity: 0.95 },
  off: { fill: "none", width: 0.28, opacity: 0.55 },
} as const;

export type Tier = keyof typeof DRAWN;

/** Which tier a shot is drawn in, by what became of it. */
export const TIER: Record<Shot["outcome"], Tier> = {
  goal: "goal",
  post: "target",
  save: "target",
  block: "off",
  miss: "off",
};

/** Which tier is drawn over which at equal size: a goal on top. */
const STACK: Record<Tier, number> = { off: 0, target: 1, goal: 2 };

/** A mark's radius, by the square root of xG so its AREA carries the chance. */
export function markRadius(xg: number | null): number {
  if (xg === null) return MARK.plain;
  return MARK.base + MARK.span * Math.sqrt(Math.min(xg, MARK.cap) / MARK.cap);
}

/** How far a mark reaches from its centre, stroke and halo included. */
export function markReach(shot: Mark): number {
  return markRadius(shot.xg) + DRAWN[TIER[shot.outcome]].width / 2 + HALO;
}

/** The order to draw marks in, as indices: bigger first so a smaller one is never buried, a goal last at equal size. */
export function drawOrder(shots: readonly Mark[]): number[] {
  return shots
    .map((shot, at) => ({ at, size: markRadius(shot.xg), stack: STACK[TIER[shot.outcome]] }))
    .sort((a, b) => b.size - a.size || a.stack - b.stack || a.at - b.at)
    .map(({ at }) => at);
}

/** A key pass in the box's units, from where it started to the edge of the shot's mark; null when it started inside. */
export function passLine(from: { x: number; y: number }, shot: Mark): { x1: number; y1: number; x2: number; y2: number } | null {
  const start = { x: from.x, y: toBoxY(from.y) };
  const end = { x: shot.x, y: toBoxY(shot.y) };
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const reach = markReach(shot);
  if (length <= reach) return null;
  const kept = (length - reach) / length;
  return { x1: start.x, y1: start.y, x2: start.x + (end.x - start.x) * kept, y2: start.y + (end.y - start.y) * kept };
}
