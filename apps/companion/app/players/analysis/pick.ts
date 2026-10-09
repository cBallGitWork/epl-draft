import type { PoolRow } from "../pool";

// Who a search box offers, out of the cached pool, never a profile read (Fantrax throttles those). A plain substring on
// the name, as the board's own search matches.

/** How many names a box offers: six fit above a phone's keyboard. */
const OFFERED = 6;

/** One name a box can offer: an id and something to print. */
export interface Candidate {
  fantraxId: string;
  name: string;
}

/** Each side's man and what its box holds, as the URL names them (`a`, `b`, `qa`, `qb`). */
export interface Sides {
  a: string | undefined;
  b: string | undefined;
  qa: string;
  qb: string;
}

/** The sides as the screen reads them: a lone man is A, whichever box chose him, with the empty box's search moved
 *  to B; and `?a=X&b=X` is the one-man screen. */
export function sides({ a, b, qa, qb }: Sides): Sides {
  if (a === undefined && b !== undefined) return { a: b, b: undefined, qa: qb, qb: qa };
  return { a, b: b === a ? undefined : b, qa, qb };
}

/** The names matching what was typed, minus the man already on the other side; an empty box offers nothing. */
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
