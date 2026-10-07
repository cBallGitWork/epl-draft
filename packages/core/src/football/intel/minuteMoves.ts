import { instantOf } from "../../time";
import { minutesIntel } from "./minutes";
import type { IntelProjections } from "./projections";
import type { IntelManifest } from "./types";

// What each xMins export moved: one update per export that changed a man's minutes for its coming gameweek by more
// than a bar, against the export it replaced. Written by `scripts/xmins-moves.ts` whatever run took the export.

/** One man's xMins for the update's gameweek, before and after. */
export interface MinutesMove {
  code: number;
  before: number;
  after: number;
}

export interface MinutesUpdate {
  /** When the new export was made, and the one it replaced: ISO instants. */
  at: string;
  since: string;
  /** The new export's coming gameweek. */
  gameweek: number;
  /** Biggest move first. */
  moves: MinutesMove[];
}

export interface IntelMinuteMoves {
  manifest: IntelManifest;
  updates: MinutesUpdate[];
}

/** What `next` moved past `bar` for its coming gameweek against `previous`; null for the same export or no move. */
export function minutesUpdate(previous: IntelProjections, next: IntelProjections, bar: number): MinutesUpdate | null {
  const gameweek = next.manifest.gameweek;
  const at = instant(next.manifest.exportedAt);
  const since = instant(previous.manifest.exportedAt);
  if (gameweek === null || at === null || since === null || at === since) return null;

  const was = minutesIntel(previous);
  const moves: MinutesMove[] = [];
  for (const [code, weeks] of minutesIntel(next)) {
    const after = weeks.find((week) => week.gameweek === gameweek)?.minutes ?? null;
    const before = was.get(code)?.find((week) => week.gameweek === gameweek)?.minutes ?? null;
    if (after !== null && before !== null && Math.abs(after - before) > bar) moves.push({ code, before, after });
  }
  moves.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before));
  return moves.length === 0 ? null : { at, since, gameweek, moves };
}

/** The recorded updates, oldest first; an update missing its stamps or gameweek is dropped. */
export function minuteMovesIntel(file: IntelMinuteMoves | null): MinutesUpdate[] {
  return (file?.updates ?? []).filter(
    (update) => typeof update?.at === "string" && typeof update.since === "string" && Number.isInteger(update.gameweek),
  );
}

/** An export's stamp as an ISO instant; the sister writes microseconds and an offset. */
function instant(stamp: string | null | undefined): string | null {
  const at = stamp == null ? null : instantOf(stamp);
  return at === null ? null : new Date(at).toISOString();
}
