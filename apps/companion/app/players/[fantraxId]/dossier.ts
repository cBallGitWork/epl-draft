import { FANTRAX_LEAGUE_ID, LEAGUE_TIMEZONE, fetchPlayerStories, londonDay, mapPlayerStories, wallClockInstant } from "@epl/core";
import { orderKey } from "@epl/core";
import type { LeagueTransaction, PlayerStory } from "@epl/core";
import { unstable_cache } from "next/cache";
import { orDegraded, refusedAs } from "../../refusals";
import { readDeals } from "../../business";
import { getLeagueSquads } from "../../squads";
import { PAGE_REVALIDATE } from "../../config";

// What has been written about a man, and the business our league has done with him.

/** Everything written about him this football year: a second profile read per man, cached on him; a refusal is none. */
export function playerStories(fantraxId: string, now: Date): Promise<PlayerStory[]> {
  const stories = unstable_cache(
    () =>
      refusedAs(fetchPlayerStories(FANTRAX_LEAGUE_ID, fantraxId), () => [], (raw) => {
        const from = footballYearFrom(now);
        return mapPlayerStories(raw).filter((story) => story.at === null || story.at >= from);
      }),
    ["player-stories", fantraxId],
    { revalidate: PAGE_REVALIDATE },
  )();
  return orDegraded(stories, () => []);
}

/** Midnight on 1 July of the football year `now` falls in (Craig, 4 Sep 2026: "Just show from 1 July this year"). */
export function footballYearFrom(now: Date): number {
  const JULY = 7;
  const [year, month] = londonDay(now).split("-").map(Number);
  return wallClockInstant(Date.UTC(month >= JULY ? year : year - 1, JULY - 1, 1), LEAGUE_TIMEZONE);
}

/** One move in this league, with the sides named rather than left as ids. */
export interface PlayerMove {
  transaction: LeagueTransaction;
  fromName: string | null;
  toName: string | null;
}

/** Every claim, drop and trade this league has made involving him, newest first, and whether the log was read whole. */
export async function playerMoves(fantraxId: string): Promise<{ moves: PlayerMove[]; whole: boolean }> {
  const [deals, squads] = await Promise.all([readDeals(), getLeagueSquads()]);
  // A league we cannot read costs the moves their names, not the moves.
  const names = new Map(
    "period" in squads
      ? squads.period.teams.map((team) => [team.teamId, team.teamName] as const)
      : [],
  );
  return { moves: movesOf(deals.rows, fantraxId, names), whole: deals.whole };
}

/** The filter and the name join, pure, so the populated path is held up by a test. */
export function movesOf(
  rows: readonly LeagueTransaction[],
  fantraxId: string,
  names: ReadonlyMap<string, string>,
): PlayerMove[] {
  const moves = rows
    .filter((row) => row.fantraxId === fantraxId)
    .map((transaction) => ({
      transaction,
      // Null where there is no side, or one we cannot name: a raw id is a worse label than none.
      fromName: transaction.fromTeamId === null ? null : (names.get(transaction.fromTeamId) ?? null),
      toName: transaction.toTeamId === null ? null : (names.get(transaction.toTeamId) ?? null),
    }));

  // Newest first by date, never by reversing the feed (each view arrives in its own order); one undated row keeps the
  // feed's order for all.
  const keyed: { move: PlayerMove; key: number }[] = [];
  for (const move of moves) {
    const key = orderKey(move.transaction.processedAt);
    if (key === null) return moves;
    keyed.push({ move, key });
  }
  return keyed.sort((a, b) => b.key - a.key).map((entry) => entry.move);
}

/** How he came to be where he is: the latest executed move that put him with his holder (null: none, so the draft),
 *  or for a man nobody holds, the drop that let him go (null: none). "unknown" when a holder's log was not read
 *  whole, as a move it lacks would read as the draft. */
export type Arrival = { joined: PlayerMove | null } | { dropped: PlayerMove | null } | "unknown";

export function arrival(moves: readonly PlayerMove[], ownerTeamId: string | null, whole: boolean): Arrival {
  if (ownerTeamId === null) {
    // A drop is on the claim view, so a lost trade view cannot hide one; a later claim means the rosters are behind.
    const latest = moves.find((move) => move.transaction.executed);
    return { dropped: latest?.transaction.kind === "drop" ? latest : null };
  }
  if (!whole) return "unknown";
  const joined = moves.find((move) => move.transaction.executed && move.transaction.toTeamId === ownerTeamId);
  return { joined: joined ?? null };
}
