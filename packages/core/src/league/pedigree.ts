import type { DraftPick } from "./fantrax/draft";
import type { PoolStatRow } from "./stats";

// Where a player came from (drafted, off the wire, or unknown) and what he has cost or repaid since. Pure.
// Joins on the Fantrax pool id alone, with no bridge.

export type Pedigree =
  /** No draft to read: not yet held, still running, or the read did not answer. */
  | { origin: "unknown" }
  /** The draft is done and his name was not called: he came off the waiver wire. */
  | { origin: "waiver" }
  | {
      origin: "draft";
      /** 1-based, as Fantrax numbers them. */
      round: number;
      /** Overall, so pick 1 is the first name called all night. */
      overall: number;
      /** Who spent the pick — not necessarily who holds him now. */
      teamId: string;
      /** Picks better than he cost, positive for a man scoring like an earlier selection.
       *  Null when Fantrax has no rank for him, never nought, which would read as "exactly par". */
      against: number | null;
    };

const UNKNOWN: Pedigree = { origin: "unknown" };
const WAIVER: Pedigree = { origin: "waiver" };

export function pedigreeOf(
  fantraxId: string,
  picks: readonly DraftPick[],
  /** Fantrax's own scoring table for the pool; only `rank` is read, never recomputed from `points`. */
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

/** Where he would go if the draft were held on today's scoring, against where he went.
 *  Ranked among the drafted, never the whole pool; a man with no rank drops out rather than sorting last. */
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
