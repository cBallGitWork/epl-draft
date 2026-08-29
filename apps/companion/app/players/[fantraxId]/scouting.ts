import { unstable_cache } from "next/cache";
import {
  FIXTURE_RUN,
  PAGE_REVALIDATE,
  clubById,
  contribution,
  fetchElementSummary,
  kickedOff,
  mapGameLog,
  nextFixtures,
  oppositionByClub,
} from "@epl/core";
import type { Club, Contribution, FootballPlayer, GameLogEntry, Opposition } from "@epl/core";
import { footballNow, seasonFixtures } from "../../football";

// The football layer's answer about one footballer: what he has done, and what
// is coming. Beside `season.ts` rather than inside it because the two are
// different questions with different sources — that file is his season as
// FANTRAX scores it, and none of this is scored by anybody.
//
// Both reads here are already warm. `footballNow` and `seasonFixtures` are the
// snapshot and the calendar every other screen holds, so a profile view costs
// FPL nothing for the round and the run; only the game log is a request of its
// own, and it is the one thing on this page behind a boundary.

/** What he has done in the round on screen. */
export interface RoundSoFar {
  gameweek: number;
  done: Contribution;
}

/** One match he has played, with the club he played it against.
 *
 *  The join is done here rather than in the table, so the component stays
 *  presentation. An opponent FPL names but does not list is undefined rather
 *  than invented — the same rule `oppositionByClub` applies. */
export interface GameLogRow {
  match: GameLogEntry;
  opponent: Club | undefined;
}

/** His round and his run to come.
 *
 *  Null for the round — not a row of noughts — in the two states where a nought
 *  would be a claim nobody can support: before HIS match has kicked off, and
 *  when FPL's live feed could not be read at all. Those are opposite situations
 *  and both are honestly answered by having no card rather than an empty one.
 *
 *  His match, and deliberately not the round's first: FPL opens a stat line for
 *  every player in the league at the round's first whistle, so a card gated on
 *  the ROUND reported "Gameweek 2 so far — 0 minutes, 0 goals" for a man playing
 *  on the Monday. `kickedOff` is the football layer's answer to exactly that,
 *  and it was written because four other views had already got it wrong. */
export async function scouting(
  player: FootballPlayer,
): Promise<{ round: RoundSoFar | null; run: Opposition[] }> {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const playing =
    !snapshot.statsUnavailable && kickedOff(oppositionByClub(snapshot).get(player.clubId));

  return {
    round: playing
      ? {
          gameweek: snapshot.gameweek,
          done: contribution(snapshot.stats.filter((s) => s.playerId === player.id)),
        }
      : null,
    run: nextFixtures(fixtures, clubById(snapshot), player.clubId, FIXTURE_RUN),
  };
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
