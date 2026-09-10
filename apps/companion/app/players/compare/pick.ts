import type { PoolRow } from "../pool";

// Who a search box offers, out of the pool the board already holds.
//
// **The pool and never a profile read.** `subject()` is one live uncached
// `getPlayerProfile` per man and Fantrax throttles that endpoint at about
// twenty-seven calls — which is exactly why comparison was a route you ARRIVED
// at with two ids rather than a screen you chose on. A picker that read a
// profile per candidate would blow that ceiling on the first keystroke. The pool
// is one `leagueCache` entry shared with the board, so a search here costs
// nothing Fantrax can see.
//
// Matching is the board's own one-liner — a plain substring on the display name,
// no fuzzy matching and no ranking. It is what `shownRows` does, and a picker
// that ordered its answers differently from the board would be two screens
// disagreeing about what "Rice" means.

/** How many names a box offers.
 *
 *  Six, because the list sits under a field on a 390 phone and the keyboard is
 *  up: more than six and the last of them are behind it, which makes the control
 *  look broken rather than full. A reader who cannot see his man in six has not
 *  typed enough of the name yet, and typing one more letter is cheaper than
 *  scrolling a list under a keyboard. */
const OFFERED = 6;

/** One name a box can offer. Deliberately not `PoolRow` — the bar needs an id
 *  and something to print, and handing a component the whole pool row invites it
 *  to reach for a figure that belongs to the board. */
export interface Candidate {
  fantraxId: string;
  name: string;
}

/** The names matching what was typed, minus the man already on the other side.
 *
 *  **An empty box offers nothing, rather than the first six of six hundred.** A
 *  list that appears before anybody has typed is a list nobody asked for, and on
 *  a phone it pushes the two men being compared off the screen. Nothing typed is
 *  a question not yet asked.
 *
 *  **The other side's man is excluded** because a comparison of a player with
 *  himself is a screen with nothing to say, and offering it invites the tap. He
 *  is excluded rather than shown-and-refused: a name you cannot pick should not
 *  be in a list of names to pick. */
export function candidates(rows: readonly PoolRow[], typed: string, taken: string | undefined): Candidate[] {
  const needle = typed.trim().toLowerCase();
  if (needle === "") return [];

  const found: Candidate[] = [];
  for (const row of rows) {
    const player = row.entry.player;
    if (player.fantraxId === taken) continue;
    if (!player.displayName.toLowerCase().includes(needle)) continue;
    found.push({ fantraxId: player.fantraxId, name: player.displayName });
    if (found.length === OFFERED) break;
  }
  return found;
}
