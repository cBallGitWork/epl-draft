import type { RoundState } from "@epl/core";

// Where the round on screen stands, in one word.
//
// Three screens ask it now — the head-to-head board, the matchups list and the
// live view — which is the rule of 3 firing. Before this they were two copies
// that had already drifted: one printed the "bonus settling" caption and one did
// not, so the same Saturday evening said two different things depending on which
// screen you were on.
//
// Deliberately style-neutral apart from the live colour: each caller sets its own
// size and weight, because the same word is a caption on one screen and part of
// a sub-heading on another. What must not vary is *which* word.
//
// Which is also why the three-rung ladder underneath it only produces two words.
// `bonus-settling` and `provisional` both read "Full time": the difference
// between them is FPL's, and every screen this word appears on is showing
// Fantrax's totals.

export default function RoundWord({ state }: { state: RoundState }) {
  if (state === null) return null;

  if (state === "live") {
    // State never rides on colour alone — the dot is always paired with a word.
    return (
      <span className="inline-flex items-center gap-1.5 text-live">
        <span className="live-dot" />
        Live
      </span>
    );
  }

  // "Final" is a promise that the number beside it has stopped moving, so it is
  // printed only at FPL's own sign-off. A manager watching his score change under
  // the word Final would be right to stop believing the screen.
  //
  // **There is no "bonus settling" caption, and there was.** It named FPL's bonus
  // ladder as the reason the total beside it was still shifting — on a scoreline
  // that is Fantrax's, under scoring that has no bonus category at all. Checked
  // against both leagues: the rehearsal league scores CS A RC Min PKM GAO AF G OG
  // YC (plus Sv PKS GA for a keeper) and the real 10 Oct league a richer set
  // again, and neither has one. That is the cross-layer leak CLAUDE.md warns
  // about — an FPL concept arriving in league territory wearing football clothes
  // — and it cost nothing to remove, because both rungs beneath `final` already
  // printed the same word.
  return <>{state === "final" ? "Final" : "Full time"}</>;
}
