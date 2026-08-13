import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import {
  PAGE_REVALIDATE,
  type FootballSnapshot,
  type FplEntry,
  type FplSquad,
  fetchEntry,
  fetchEntryPoints,
  fetchPicks,
  mapEntry,
  mapSquad,
} from "@epl/core";
import { footballNow } from "../football";

// The other game. A manager's FPL side, read from the id in the URL they already
// share — not a credential, so no sign-in and no secret.
//
// Stored in a plain unsigned cookie, unlike the team session: an entry id is
// public, claiming somebody else's shows you their team on your own phone and
// nothing more, and there is nothing here to authorize.

const ENTRY_COOKIE = "fpl";
const SEASON_IN_SECONDS = 60 * 60 * 24 * 300;

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

/** One manager's side. Cached per entry id, so a phone refreshing does not mean
 *  FPL being asked again. */
const readSide = unstable_cache(
  async (entryId: number, snapshot: FootballSnapshot): Promise<FplSide | null> => {
    const raw = await fetchEntry(entryId);
    if (raw === null) return null;

    const entry = mapEntry(raw);
    // FPL's own idea of which round this entry is in, falling back to the one the
    // football snapshot is showing — they agree in the ordinary case and FPL is
    // authoritative about its own game.
    const gameweek = entry.currentEvent ?? snapshot.gameweek;
    const picks = await fetchPicks(entryId, gameweek);

    if (picks === null) return { entry, squad: null };

    // Element ids are per-season, so this lookup lives and dies inside one
    // snapshot and nothing keyed by it is ever persisted (CODE_RULES §3).
    const byId = new Map(snapshot.players.map((player) => [player.id, player]));
    const live = await fetchEntryPoints(gameweek);

    return {
      entry,
      squad: mapSquad(
        picks,
        (element) => byId.get(element)?.code ?? null,
        (element) => live.get(element) ?? 0,
      ),
    };
  },
  ["fpl-side"],
  { revalidate: PAGE_REVALIDATE },
);

export async function mySide(): Promise<FplSide | null> {
  const entryId = await myEntryId();
  if (entryId === null) return null;
  return readSide(entryId, await footballNow());
}

export { ENTRY_COOKIE, SEASON_IN_SECONDS };
