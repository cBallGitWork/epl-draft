import { type fetchLiveScoring, mapLivePlayerPoints } from "@epl/core";

// Which period's live scoring shape-diff compares: one nobody has played prices nobody, so nothing in a man's row is read.

type LiveScoring = Awaited<ReturnType<typeof fetchLiveScoring>>;

/** A league's live scoring at its last period with a scored man, read back from `open`; null when no period has one.
 *  A group subtotal (`_5010`) is not a man. */
export async function lastScored(
  open: number,
  read: (period: number) => Promise<LiveScoring>,
): Promise<LiveScoring | null> {
  for (let period = open; period >= 1; period -= 1) {
    const live = await read(period);
    if (mapLivePlayerPoints(live).some((team) => team.players.length > 0)) return live;
  }
  return null;
}
