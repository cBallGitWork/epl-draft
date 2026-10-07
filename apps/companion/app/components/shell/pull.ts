// The pull-to-refresh gesture as numbers: how far the plate has come down, whether letting go refreshes, and whether
// a drag is a pull at all or a sideways swipe across a wide table.

export interface PullRules {
  /** The plate's travel, in px, at which letting go refreshes. */
  arm: number;
  /** The furthest the plate comes down, in px. */
  max: number;
  /** Plate travel per px of finger travel, so the plate lags the finger as a native one does. */
  damp: number;
  /** Finger travel, in px, before a drag is read as a pull or not. */
  intent: number;
  /** How much steeper than wide a drag must be to be a pull. */
  steep: number;
}

/** How far the plate has come down for a finger `dy` px below where it started: damped, and stopped at `max`. */
export function pullDistance(dy: number, rules: PullRules): number {
  return Math.min(rules.max, Math.max(0, dy * rules.damp));
}

/** Whether letting go at this distance refreshes. */
export function armed(distance: number, rules: PullRules): boolean {
  return distance >= rules.arm;
}

/** What a drag is once it has travelled far enough to say: a pull (down, and steep), or anything else. */
export function intent(dx: number, dy: number, rules: PullRules): "pull" | "other" | null {
  if (Math.hypot(dx, dy) < rules.intent) return null;
  return dy > 0 && dy >= Math.abs(dx) * rules.steep ? "pull" : "other";
}
