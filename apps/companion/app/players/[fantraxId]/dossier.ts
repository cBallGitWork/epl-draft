import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerStories, mapPlayerStories } from "@epl/core";
import { orderKey } from "@epl/core";
import type { LeagueTransaction, PlayerStory } from "@epl/core";
import { unstable_cache } from "next/cache";
import { orDegraded, orRefusal } from "../../refusals";
import { readDeals } from "../../business";
import { getLeagueSquads } from "../../squads";
import { PAGE_REVALIDATE } from "../../config";

// The two league-wide reads a player screen needs a slice of.
//
// **Both are read WHOLE and cached, then filtered here.** Neither endpoint
// answers per player: `getPlayerNews` ignores `playerId` and hands back the whole
// pool's stories, and the transaction feed is the league's business rather than
// one man's. So one read serves every player screen, and the second tap on any
// player costs nothing — which is the opposite of `getPlayerProfile`, where one
// tap is one request and a sweep is forbidden.

/** Everything written about him this football year, newest first.
 *
 *  **A second read per tap, and it is worth one.** `getPlayerProfile` is already
 *  one request per tap and this is a second against the same endpoint — but it is
 *  the only route to a HISTORY. The pool-wide `getPlayerNews` files one story per
 *  player and the profile's own `latestNews` is a truncated sentence; this is
 *  every story with its full analysis. Cached on the player, so a reader moving
 *  between his tabs pays once.
 *
 *  A news read we cannot make costs the block and not the screen. */
export function playerStories(fantraxId: string, now: Date): Promise<PlayerStory[]> {
  const stories = unstable_cache(
    async () => {
      const raw = await orRefusal(fetchPlayerStories(FANTRAX_LEAGUE_ID, fantraxId));
      if (raw instanceof FantraxError) return [];
      const from = footballYearFrom(now);
      return mapPlayerStories(raw).filter((story) => story.at === null || story.at >= from);
    },
    ["player-stories", fantraxId],
    { revalidate: PAGE_REVALIDATE },
  )();
  return orDegraded(stories, () => []);
}

/** Midnight on 1 July of the football year `now` falls in (Craig, 4 Sep 2026:
 *  "Just show from 1 July this year").
 *
 *  **The year is derived, never written down.** A season runs July to June, so
 *  January to June belongs to the July before it — a constant `2026` here would
 *  be wrong from 1 January and silently show eighteen months of news. July is the
 *  constant because that is when a football year starts and when a summer
 *  signing's news begins to matter; the year it lands in is arithmetic. */
function footballYearFrom(now: Date): number {
  const JULY = 6; // `getMonth` is zero-based, and this is the one place that bites.
  const year = now.getMonth() >= JULY ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, JULY, 1).getTime();
}

/** One move in this league, with the sides named rather than left as ids. */
export interface PlayerMove {
  transaction: LeagueTransaction;
  fromName: string | null;
  toName: string | null;
}

/** Every claim, drop and trade this league has made involving him, newest first.
 *
 *  **This is what CM's Transfer tab is for** — the game lists a player's moves
 *  between clubs, and ours lists his moves between managers. The draft pick above
 *  it says how he arrived; this says what has happened since.
 *
 *  Lineup changes are not business anyone did with anyone and `business.ts`
 *  already refuses to read them, so they cannot appear here either. */
export async function playerMoves(fantraxId: string): Promise<PlayerMove[]> {
  const [deals, squads] = await Promise.all([readDeals(), getLeagueSquads()]);
  // A league we cannot read costs the move its NAMES, not the move: the kind and
  // the date are still true, and an id is a worse label than none.
  const names = new Map(
    "period" in squads
      ? squads.period.teams.map((team) => [team.teamId, team.teamName] as const)
      : [],
  );
  return movesOf(deals.rows, fantraxId, names);
}

/** The filter and the name join, apart from the reads that feed them.
 *
 *  Pure, and separate because the league this app serves has had no transactions
 *  at all — so the populated path cannot be seen on a screen here and has to be
 *  held up by a test instead. `fd9wrh0elyr9ytv6` has 88 claim-drop rows and the
 *  dummy league has none (counted 4 Sep 2026). */
export function movesOf(
  rows: readonly LeagueTransaction[],
  fantraxId: string,
  names: ReadonlyMap<string, string>,
): PlayerMove[] {
  const moves = rows
    .filter((row) => row.fantraxId === fantraxId)
    .map((transaction) => ({
      transaction,
      // Null where there is no side: nobody owns a free agent, and a dropped
      // player goes to the pool rather than to another manager. An id we cannot
      // name is also null — a raw team id is a worse label than none.
      fromName: transaction.fromTeamId === null ? null : (names.get(transaction.fromTeamId) ?? null),
      toName: transaction.toTeamId === null ? null : (names.get(transaction.toTeamId) ?? null),
    }));

  // **Newest first, and NOT by reversing the feed.** PLATFORM_NOTES records that
  // each transaction view arrives newest-first ON ITS OWN, so a reverse gives
  // oldest-first — the opposite of what was asked for — and concatenating two
  // views leaves every claim before every trade, which is not a history either.
  // `orderKey` is the same comparison the paper's week is built on.
  //
  // All-or-nothing, on that file's rule: one row we cannot date would sit where
  // the comparator happened to put it, and the feed order it displaced was at
  // least each view's own truth.
  const keyed: { move: PlayerMove; key: number }[] = [];
  for (const move of moves) {
    const key = orderKey(move.transaction.processedAt);
    if (key === null) return moves;
    keyed.push({ move, key });
  }
  return keyed.sort((a, b) => b.key - a.key).map((entry) => entry.move);
}

/** How he came to his holder: the latest executed move that put him there, or null (a draft pick). */
export function joinedBy(moves: readonly PlayerMove[], ownerTeamId: string | null): PlayerMove | null {
  if (ownerTeamId === null) return null;
  return moves.find((move) => move.transaction.executed && move.transaction.toTeamId === ownerTeamId) ?? null;
}
