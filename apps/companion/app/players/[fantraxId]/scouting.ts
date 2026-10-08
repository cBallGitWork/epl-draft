import { unstable_cache } from "next/cache";
import {
  FIXTURE_RUN,
  clubById,
  fetchElementSummary,
  mapGameLog,
  nextFixtures,
} from "@epl/core";
import type { Club, FootballPlayer, GameLogEntry, Opposition } from "@epl/core";
import { footballNow, seasonFixtures } from "../../football";
import { PAGE_REVALIDATE } from "../../config";
import { orDegraded } from "../../refusals";

// The football layer on one footballer: what is coming, off the warm snapshot and calendar, and what he has done,
// off his game log, the one read of his own.

/** One match he has played, with the club he played it against; undefined for one FPL does not list. */
export interface GameLogRow {
  match: GameLogEntry;
  opponent: Club | undefined;
}

/** The next few matches his club has, in order. */
export async function scouting(player: FootballPlayer): Promise<Opposition[]> {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  return nextFixtures(fixtures, clubById(snapshot), player.clubId, FIXTURE_RUN);
}

/** Every match of his season, most recent first: read by FPL's `id`, cached by `code`, since ids recycle each summer.
 *  Null when FPL would not answer and nothing is held for him: the page says so rather than breaking. */
export async function gameLog(player: FootballPlayer): Promise<GameLogRow[] | null> {
  const read = unstable_cache(
    async () => mapGameLog(await fetchElementSummary(player.id)),
    ["player-game-log", String(player.code)],
    { revalidate: PAGE_REVALIDATE },
  );
  const [log, snapshot] = await Promise.all([orDegraded(read(), () => null), footballNow()]);
  if (log === null) return null;
  const clubs = clubById(snapshot);
  return log.map((match) => ({ match, opponent: clubs.get(match.opponentClubId) }));
}
