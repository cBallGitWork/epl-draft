import { FPL_LINES, FPL_STARTERS } from "./types";
import type { FplPick, FplSquad } from "./types";

// One FPL side arranged as a pitch: the XI in their lines, the bench under it.
//
// Pure, and in this adapter rather than in the view, for the same reason
// `join/lineup.ts` holds our own league's arrangement: it is arithmetic over a
// squad, it is the same on every screen that draws one, and it is the part worth
// testing. The view supplies the sticker.
//
// **A line is FPL's `element_type`, never a Fantrax letter.** The two games file
// the same footballer differently, and this side is FPL's.

export interface FplLine {
  /** `GK`, `DEF`, `MID`, `FWD` — and also the row's key. */
  label: string;
  players: FplPick[];
}

/** The XI in their lines back to front, and whoever is waiting.
 *
 *  FPL's slot ordering says which is which: 1–11 start and 12–15 wait, in the
 *  order they would come on. Kept in that order on the bench, because it is the
 *  one thing the ordering means.
 *
 *  Grouped from the picks rather than from `FPL_LINES`, so a line nobody is in
 *  is simply absent — three at the back and no forwards is a real side — and a
 *  pick FPL gave no `element_type` still stands somewhere. He gets the raw
 *  number for a label on the same rule the rest of the app follows for a
 *  vocabulary it has not seen: printed verbatim, never guessed at, and never
 *  dropped from a fifteen. */
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
