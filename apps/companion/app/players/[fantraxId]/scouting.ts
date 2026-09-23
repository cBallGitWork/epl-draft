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

// The football layer's answer about one footballer: what is coming, and what he
// has done. Beside `season.ts` rather than inside it because the two are
// different questions with different sources — that file is his season as
// FANTRAX scores it, and none of this is scored by anybody.
//
// Both reads here are already warm. `footballNow` and `seasonFixtures` are the
// snapshot and the calendar every other screen holds, so a profile view costs
// FPL nothing for the round and the run; only the game log is a request of its
// own, and it is the one thing on this page behind a boundary.

/** One match he has played, with the club he played it against.
 *
 *  The join is done here rather than in the table, so the component stays
 *  presentation. An opponent FPL names but does not list is undefined rather
 *  than invented — the same rule `oppositionByClub` applies. */
export interface GameLogRow {
  match: GameLogEntry;
  opponent: Club | undefined;
}

/** The next few matches his club has, in order.
 *
 *  **This used to answer his round as well**, and the round half went with the
 *  card that drew it (Craig, 4 Sep 2026: "Remove gameweek so far"). What that
 *  card knew is worth keeping here rather than in a deleted file: FPL opens a
 *  stat line for every player in the league at the round's FIRST whistle, so
 *  anything gated on the round rather than on HIS match reports "0 minutes, 0
 *  goals" for a man playing on the Monday. `kickedOff` is the football layer's
 *  answer to that and it was written because four other views had got it wrong.
 *
 *  The read is already warm — `footballNow` and `seasonFixtures` are the
 *  snapshot and the calendar every other screen holds — so this costs FPL
 *  nothing. Only the game log below is a request of its own. */
export async function scouting(player: FootballPlayer): Promise<Opposition[]> {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  return nextFixtures(fixtures, clubById(snapshot), player.clubId, FIXTURE_RUN);
}

/** Every match of his season, most recent first.
 *
 *  Cached under FPL's season-stable `code`, and read with its per-season `id`.
 *  The id is an argument and never the key: ids are recycled every summer
 *  (CODE_RULES §3), so a cache keyed on one would serve last August's answer to
 *  a different footballer. It is resolved from the snapshot for this request and
 *  goes no further than this call. */
export async function gameLog(player: FootballPlayer): Promise<GameLogRow[]> {
  const read = unstable_cache(
    async () => mapGameLog(await fetchElementSummary(player.id)),
    ["player-game-log", String(player.code)],
    { revalidate: PAGE_REVALIDATE },
  );
  const clubs = clubById(await footballNow());
  return (await read()).map((match) => ({ match, opponent: clubs.get(match.opponentClubId) }));
}
