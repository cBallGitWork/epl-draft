import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerNews, mapPlayerNews } from "@epl/core";
import type { LeagueTransaction, PlayerStory } from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";
import { readDeals } from "../../business";
import { getLeagueSquads } from "../../squads";

// The two league-wide reads a player screen needs a slice of.
//
// **Both are read WHOLE and cached, then filtered here.** Neither endpoint
// answers per player: `getPlayerNews` ignores `playerId` and hands back the whole
// pool's stories, and the transaction feed is the league's business rather than
// one man's. So one read serves every player screen, and the second tap on any
// player costs nothing — which is the opposite of `getPlayerProfile`, where one
// tap is one request and a sweep is forbidden.

/** Every story Fantrax's provider has filed about anybody in the pool.
 *
 *  Its own cache entry rather than part of the squads read, on `business.ts`'s
 *  reasoning: news moves on a different rhythm from a lineup, and a news read we
 *  cannot make should cost a block rather than a screen. */
const readNews = leagueCache("player-news", async (): Promise<PlayerStory[]> => {
  const raw = await orRefusal(fetchPlayerNews(FANTRAX_LEAGUE_ID));
  return raw instanceof FantraxError ? [] : mapPlayerNews(raw);
});

/** The latest thing said about him, or null.
 *
 *  **The latest, and not a season's worth.** Fantrax files one story per player —
 *  74 stories across 74 players on 4 Sep 2026 — so this is his most recent and
 *  the screen must not offer it as a history. Sorted anyway, because "one" is an
 *  observation about a payload and not a guarantee about it. */
export async function playerStory(fantraxId: string): Promise<PlayerStory | null> {
  const stories = (await readNews()).filter((story) => story.fantraxId === fantraxId);
  return stories.sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0] ?? null;
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
  return rows
    .filter((row) => row.fantraxId === fantraxId)
    .map((transaction) => ({
      transaction,
      // Null where there is no side: nobody owns a free agent, and a dropped
      // player goes to the pool rather than to another manager. An id we cannot
      // name is also null — a raw team id is a worse label than none.
      fromName: transaction.fromTeamId === null ? null : (names.get(transaction.fromTeamId) ?? null),
      toName: transaction.toTeamId === null ? null : (names.get(transaction.toTeamId) ?? null),
    }))
    // Newest first, which is the order a history is read in. The feed arrives
    // oldest first.
    .reverse();
}
