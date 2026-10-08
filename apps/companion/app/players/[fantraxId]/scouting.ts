import { unstable_cache } from "next/cache";
import {
  FIXTURE_RUN,
  clubById,
  fetchElementSummary,
  historyOf,
  mapGameLog,
  nextFixtures,
} from "@epl/core";
import type { Club, FootballPlayer, GameLogEntry, Opposition } from "@epl/core";
import { footballNow, seasonFixtures } from "../../football";
import { PLAYER_LOG_REVALIDATE } from "../../config";
import { orDegraded } from "../../refusals";
import { intelHistory } from "../../intel";

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

/** His season, and when it was taken if it is the sister repo's copy rather than FPL's own answer. */
export interface GameLog {
  rows: GameLogRow[];
  /** Null for FPL's own; else when the sweep fetched the copy, which the page prints. */
  heldAt: string | null;
}

/** Every match of his season, most recent first: read by FPL's `id`, cached by `code`, since ids recycle each summer.
 *  FPL first, then its last cached answer, then the sister repo's copy; null only when none of the three has him. */
export async function gameLog(player: FootballPlayer): Promise<GameLog | null> {
  const read = unstable_cache(
    async () => mapGameLog(await fetchElementSummary(player.id)),
    ["player-game-log", String(player.code)],
    { revalidate: PLAYER_LOG_REVALIDATE },
  );
  const [live, snapshot] = await Promise.all([orDegraded(read(), () => null), footballNow()]);
  const held = live === null ? await heldHistory(player.code) : null;
  const log = live ?? (held === null ? null : mapGameLog(held.summary));
  if (log === null) return null;
  const clubs = clubById(snapshot);
  return { rows: log.map((match) => ({ match, opponent: clubs.get(match.opponentClubId) })), heldAt: held?.at ?? null };
}

/** His element-summary as the sister repo's sweep last fetched it, and when; null where it has none. */
export async function heldHistory(code: number) {
  const file = await intelHistory();
  const summary = historyOf(file, code);
  return summary === null ? null : { summary, at: file.manifest.exportedAt };
}
