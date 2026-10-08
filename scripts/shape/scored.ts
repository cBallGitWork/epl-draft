import { type fetchLiveScoring, type fetchStandings, mapLivePlayerPoints } from "@epl/core";

// Which period's live scoring shape-diff compares: one nobody has played prices nobody, so nothing in a man's row is read.

type LiveScoring = Awaited<ReturnType<typeof fetchLiveScoring>>;
type Standings = Awaited<ReturnType<typeof fetchStandings>>;

/** The league's live scoring at its last period with a scored man, read back from `open`; null when none has one.
 *  A group subtotal (`_5010`) is not a man. */
async function lastScored(open: number, read: (period: number) => Promise<LiveScoring>): Promise<LiveScoring | null> {
  for (let period = open; period >= 1; period -= 1) {
    const live = await read(period);
    if (mapLivePlayerPoints(live).some((team) => team.players.length > 0)) return live;
  }
  return null;
}

/** Whether any team's record ("W-L-T", 0-0-0 until a period is settled) counts a game; a record moves only after men
 *  have scored. */
function playedAny(standings: Standings): boolean {
  if (!Array.isArray(standings)) return false;
  return standings.some((row) => (row.points ?? "").split("-").some((count) => Number(count) > 0));
}

/** The live scoring to compare: the last period with a scored man; "unplayed" when no period has one because no game
 *  has been played; null when one has and still no period up to `open` has a scored man. */
export async function comparableLive(
  open: number,
  readLive: (period: number) => Promise<LiveScoring>,
  readStandings: () => Promise<Standings>,
): Promise<LiveScoring | "unplayed" | null> {
  const live = await lastScored(open, readLive);
  if (live !== null) return live;
  return playedAny(await readStandings()) ? null : "unplayed";
}
