import type { UnmappedEntry } from "./bridge";
import type { Proposal } from "./match";
import { ABSENCE_MAX_SCORE } from "./similarity";

// Which of a run's proposals the script may answer itself, and which are a
// person's question. `match.ts` decides who claims whom; this file decides what
// to do with everybody nobody claimed.

/** A run's leftovers, split by who can settle them. */
export interface UnmappedSplit {
  /** Recorded in the bridge: nothing in the FPL list this run read looked like
   *  them. Re-derived next run, so it corrects itself. */
  assumed: Record<string, UnmappedEntry>;
  /** Left in the review file: FPL has a plausible answer and the script cannot
   *  tell which one it is. */
  forReview: Proposal[];
}

/** Can the script answer this itself?
 *
 *  `no-candidates` and a low `below-threshold` say the same thing about the
 *  player: nothing in the FPL list this run read looked like him. They differ
 *  only in whether his club's unclaimed pool happened to be empty, which is a
 *  fact about the pool on the day — a pool that refills turns one label into the
 *  other with no player having changed — so persisting the distinction would
 *  persist an artefact.
 *
 *  `ambiguous` and `identity-taken` are the opposite: FPL holds a plausible
 *  answer and the evidence cannot pick it. Guessing there writes a whole season
 *  onto the wrong footballer, which is the one thing this layer exists to
 *  prevent.
 *
 *  `below-threshold` spans both, which is why it is the only reason that reads a
 *  score. Too low to match is not the same claim as nobody being there, and above
 *  `ABSENCE_MAX_SCORE` the near-miss is somebody — a transliteration the metric
 *  cannot bridge, and a person's question. */
function isAbsence(proposal: Proposal): boolean {
  switch (proposal.reason) {
    case "no-candidates":
      return true;
    case "below-threshold": {
      const best = proposal.candidates[0];
      return best === undefined || best.score <= ABSENCE_MAX_SCORE;
    }
    case "ambiguous":
    case "identity-taken":
      return false;
  }
}

/** Record the residue that has no FPL counterpart, and hand back the rest.
 *
 *  A proposal the script answers here stops being a proposal, which is the whole
 *  point: without it the same academy players are re-offered for review on every
 *  run, forever, and the review file is never empty enough to read. */
export function assumeUnmapped(proposals: Proposal[]): UnmappedSplit {
  const assumed: Record<string, UnmappedEntry> = {};
  const forReview: Proposal[] = [];

  for (const proposal of proposals) {
    if (!isAbsence(proposal)) {
      forReview.push(proposal);
      continue;
    }

    // Sorted best-first by `match.ts`, and empty when the club's pool was.
    const best = proposal.candidates[0];
    assumed[proposal.fantraxId] =
      best === undefined
        ? { status: "unmapped", unmappedBy: "no-fpl-match" }
        : { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: best.score };
  }

  return { assumed, forReview };
}
