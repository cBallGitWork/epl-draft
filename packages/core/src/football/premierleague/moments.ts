import type { RawPlEvent } from "./raw";
import { saysInjury } from "./injuries";
import { addedMinutesOf, shotOf, varCallOf, type PlShot } from "./momentWords";

// One match's commentary as the moments a report is built from: every shot, goal, card, change and VAR call, in order.
// Names come from `playerIds` alone; the prose is read only for Opta's fixed clauses (`momentWords.ts`).

export type MomentKind =
  | "goal" | "penalty-goal" | "own-goal" | "ruled-out"
  | "saved" | "missed" | "blocked" | "woodwork"
  | "penalty-won" | "penalty-conceded" | "penalty-missed" | "penalty-saved"
  | "booked" | "second-yellow" | "sent-off" | "substitution" | "injured-off"
  | "var" | "added-time" | "half-time" | "full-time";

export interface PlMoment {
  id: number;
  /** The clock as printed, `"45+4"`; never arithmetic on a stoppage minute. */
  minute: string;
  half: 1 | 2;
  kind: MomentKind;
  /** FPL codes, positional as Opta's `playerIds`: [the man, the other] — scorer and maker, on and off, shooter and maker. */
  men: readonly [number | null, number | null];
  shot: PlShot | null;
  /** A change forced by injury. */
  injury: boolean;
  addedMinutes: number | null;
  varCall: ReturnType<typeof varCallOf>;
}

// Opta's type strings. A penalty miss is filed as `miss` or `post` and only its text says so.
const KINDS: Record<string, MomentKind> = {
  goal: "goal",
  "penalty goal": "penalty-goal",
  "own goal": "own-goal",
  "VAR cancelled goal": "ruled-out",
  "attempt saved": "saved",
  miss: "missed",
  "attempt blocked": "blocked",
  post: "woodwork",
  "penalty won": "penalty-won",
  "penalty lost": "penalty-conceded",
  "penalty saved": "penalty-saved",
  "yellow card": "booked",
  "secondyellow card": "second-yellow",
  "red card": "sent-off",
  substitution: "substitution",
  "player retired": "injured-off",
  "contentious referee decisions": "var",
  "added time": "added-time",
  "end 1": "half-time",
  "end 2": "full-time",
};

const SHOTS: ReadonlySet<MomentKind> = new Set([
  "goal", "penalty-goal", "saved", "missed", "blocked", "woodwork", "penalty-missed", "penalty-saved",
]);

/** The first half's clock reads 45 or less, its added time included (`"45+4"`); a label with no clock is not placed. */
function halfOf(minute: string): 1 | 2 | null {
  const at = Number.parseInt(minute, 10);
  if (Number.isNaN(at)) return null;
  return at <= 45 ? 1 : 2;
}

/** The match's moments in the feed's own order (read with `sort=asc`); `secs` runs backwards across half-time. */
export function plMoments(events: readonly RawPlEvent[], codes: ReadonlyMap<number, number>): PlMoment[] {
  const moments: PlMoment[] = [];
  for (const event of events) {
    const base = KINDS[event.type];
    const minute = event.time?.label;
    const half = minute === undefined ? null : halfOf(minute);
    if (base === undefined || minute === undefined || half === null) continue;
    // `end 14` repeats the full-time whistle with a junk `"01"` clock.
    if (base === "full-time" && half === 1) continue;

    const kind = base !== "penalty-won" && /^Penalty missed!/.test(event.text) ? "penalty-missed" : base;
    const ids = event.playerIds ?? [];
    const man = (i: number) => (ids[i] === undefined ? null : (codes.get(ids[i]) ?? null));
    moments.push({
      id: event.id,
      minute,
      half,
      kind,
      men: [man(0), man(1)],
      shot: SHOTS.has(kind) ? shotOf(event.text) : null,
      injury: kind === "injured-off" || saysInjury(event),
      addedMinutes: kind === "added-time" ? addedMinutesOf(event.text) : null,
      varCall: kind === "var" ? varCallOf(event.text) : null,
    });
  }
  return moments;
}
