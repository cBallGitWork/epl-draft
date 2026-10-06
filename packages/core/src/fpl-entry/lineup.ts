import { FPL_LINES, FPL_STARTERS } from "./types";
import type { FplPick, FplSquad } from "./types";

// One FPL side arranged as a pitch, the XI in lines and the bench under it. A line is FPL's `element_type`, never a Fantrax letter.

export interface FplLine {
  /** `GK`, `DEF`, `MID`, `FWD` — and also the row's key. */
  label: string;
  players: FplPick[];
}

/** The XI (slots 1–11) in lines back to front, and the bench (12–15) in the order they come on. Grouped from the
 *  picks, so an empty line is absent, and an unknown `element_type` is labelled verbatim, never dropped. */
export function fplLineup(squad: FplSquad): { rows: FplLine[]; bench: FplPick[] } {
  const byLine = new Map<number, FplPick[]>();
  for (const pick of squad.picks) {
    if (pick.slot > FPL_STARTERS) continue;
    const players = byLine.get(pick.line);
    if (players) players.push(pick);
    else byLine.set(pick.line, [pick]);
  }

  return {
    rows: [...byLine.entries()]
      .sort(([a], [b]) => a - b)
      .map(([line, players]) => ({
        label: FPL_LINES.find((known) => known.line === line)?.name ?? String(line),
        players: players.sort((a, b) => a.slot - b.slot),
      })),
    bench: squad.picks
      .filter((pick) => pick.slot > FPL_STARTERS)
      .sort((a, b) => a.slot - b.slot),
  };
}
