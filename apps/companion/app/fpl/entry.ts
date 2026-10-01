import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import {
  type FplEntry,
  type FplSquad,
  fetchEntry,
  fetchLive,
  fetchPicks,
  mapEntry,
  mapScoreLines,
  mapSquad,
} from "@epl/core";
import { ENTRY_COOKIE, PAGE_REVALIDATE } from "../config";
import { footballNow } from "../football";

// The other game. A manager's FPL side, read from the id in the URL they already
// share — not a credential, so no sign-in and no secret.
//
// Stored in a plain unsigned cookie, unlike the team session: an entry id is
// public, claiming somebody else's shows you their team on your own phone and
// nothing more, and there is nothing here to authorize.

export async function myEntryId(): Promise<number | null> {
  const raw = (await cookies()).get(ENTRY_COOKIE)?.value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export interface FplSide {
  entry: FplEntry;
  /** Null until the round has been played — FPL answers 404 for picks that do
   *  not exist yet, which is every gameweek before the season starts. */
  squad: FplSquad | null;
}

/** One manager's entry and picks, cached per entry id and the round to fall back on. Nothing
 *  from the snapshot goes into the key: it carries `fetchedAt`, so every read was a new entry. */
const readEntry = unstable_cache(
  async (entryId: number, fallback: number) => {
    const raw = await fetchEntry(entryId);
    if (raw === null) return null;
    const entry = mapEntry(raw);
    // FPL is authoritative about which round its own game is in.
    const gameweek = entry.currentEvent ?? fallback;
    return { entry, gameweek, picks: await fetchPicks(entryId, gameweek) };
  },
  ["fpl-entry"],
  { revalidate: PAGE_REVALIDATE },
);

/** FPL's scoring lines for every man in a round, by element id: one read for the pitch and the card. */
const roundScoring = unstable_cache(
  async (gameweek: number) => mapScoreLines(await fetchLive(gameweek)),
  ["fpl-score-lines"],
  { revalidate: PAGE_REVALIDATE },
);

export async function mySide(): Promise<FplSide | null> {
  const entryId = await myEntryId();
  if (entryId === null) return null;
  const snapshot = await footballNow();
  const read = await readEntry(entryId, snapshot.gameweek);
  if (read === null) return null;
  if (read.picks === null) return { entry: read.entry, squad: null };

  // Element ids are per-season, so this join lives inside one snapshot and is never persisted.
  const byId = new Map(snapshot.players.map((player) => [player.id, player]));
  const lines = await roundScoring(read.gameweek);
  return {
    entry: read.entry,
    squad: mapSquad(
      read.picks,
      (element) => byId.get(element)?.code ?? null,
      (element) => lines[element] ?? [],
    ),
  };
}
