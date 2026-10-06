import type { UnmappedEntry } from "./bridge";
import type { Proposal } from "./match";
import { ABSENCE_MAX_SCORE } from "./similarity";

// Which of a run's unclaimed proposals the script may answer itself, and which are a person's question.

/** A run's leftovers, split by who can settle them. */
export interface UnmappedSplit {
  /** Recorded in the bridge: nothing in this run's FPL list looked like them. Re-derived next run. */
  assumed: Record<string, UnmappedEntry>;
  /** Left in the review file: FPL has a plausible answer the script cannot pick. */
  forReview: Proposal[];
}

/** Whether the script may answer this itself: nobody looked like him. `ambiguous` and `identity-taken` never;
 *  `below-threshold` only at or under `ABSENCE_MAX_SCORE`, since a nearer miss may be him. */
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

/** Record the residue that has no FPL counterpart, so it is not re-offered for review every run; hand back the rest. */
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
