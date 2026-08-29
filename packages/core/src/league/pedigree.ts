import type { DraftPick } from "./fantrax/draft";
import type { PoolStatRow } from "./stats";

// Where a player came from, and what he has cost or repaid since. Pure.
//
// **The one fact a draft league has that no other fantasy format does.** Every
// man on every squad has a price somebody paid in draft position, and the gap
// between that price and what he has actually done is the league's whole
// conversation. A fourteenth-rounder outscoring the first pick is a story; the
// first pick doing what he was taken to do is not.
//
// It joins with no bridge: `playerId` on a draft pick is the Fantrax pool id,
// the same id the rosters, the stat tables and the transaction log carry. This
// is entirely inside the league layer and touches the football one nowhere.
//
// **Three origins, and the third is why this is a union.** He was taken in the
// draft; or the draft happened and nobody took him, which is its own pedigree —
// he came off the wire; or there is no draft to read at all. That last one is
// not a hypothetical or a failure mode: our real league drafts on 10 Oct, so for
// nine weeks `getDraftResults` answers a draft that has not run, and a player
// filed as "undrafted" then would be a confident wrong answer about all 671 of
// them at once.

export type Pedigree =
  /** No draft to read: it has not happened, it is still running, or the read did
   *  not answer. Says nothing rather than guessing which. */
  | { origin: "unknown" }
  /** The draft is done and his name was not called. He came off the waiver
   *  wire, which is a pedigree and not a missing one. */
  | { origin: "waiver" }
  | {
      origin: "draft";
      /** 1-based, as Fantrax numbers them. */
      round: number;
      /** Overall, so pick 1 is the first name called all night. */
      overall: number;
      /** Who spent the pick — not necessarily who holds him now. */
      teamId: string;
      /** Picks better than he cost: positive for a man scoring like an earlier
       *  selection, negative for one who has not repaid his. Null when Fantrax
       *  has no points for him, or for nobody — an unscored league cannot say
       *  what a pick was worth, and nought would read as "exactly par". */
      against: number | null;
    };

const UNKNOWN: Pedigree = { origin: "unknown" };
const WAIVER: Pedigree = { origin: "waiver" };

export function pedigreeOf(
  fantraxId: string,
  picks: readonly DraftPick[],
  /** Fantrax's own scoring table for the pool. Only `rank` is read, and it is
   *  read rather than recomputed from `points`: how they break a tie between two
   *  men on the same total is their arrangement, exactly as the standings order
   *  is. */
  scored: readonly PoolStatRow[],
): Pedigree {
  if (picks.length === 0) return UNKNOWN;

  const pick = picks.find((taken) => taken.fantraxId === fantraxId);
  if (pick === undefined) return WAIVER;

  return {
    origin: "draft",
    round: pick.round,
    overall: pick.overall,
    teamId: pick.teamId,
    against: againstPick(pick, picks, scored),
  };
}

/** Where he would go if the draft were held on today's scoring, against where he
 *  actually went.
 *
 *  **Ranked among the drafted and not across the pool**, because that is the
 *  population a pick is spent out of: a man 300th in a pool of 671 has no
 *  comparable pick number, and putting the two side by side would make every
 *  drafted player look like a disaster.
 *
 *  A drafted man Fantrax has no rank for drops out of the ordering rather than
 *  sorting to the bottom, which would say he has been the worst pick of the
 *  night when what we have is no number. Everyone below him moves up one, which
 *  is the honest reading of a league we can only partly score, and it is why the
 *  figure is a comparison and never a claim about him alone. */
function againstPick(
  pick: DraftPick,
  picks: readonly DraftPick[],
  scored: readonly PoolStatRow[],
): number | null {
  const ranks = new Map(scored.map((row) => [row.fantraxId, row.rank]));

  const order = picks
    .flatMap((taken) => {
      const rank = ranks.get(taken.fantraxId);
      return typeof rank === "number" ? [{ fantraxId: taken.fantraxId, rank }] : [];
    })
    .sort((a, b) => a.rank - b.rank);

  const now = order.findIndex((entry) => entry.fantraxId === pick.fantraxId);
  return now === -1 ? null : pick.overall - (now + 1);
}
