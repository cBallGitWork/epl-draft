import type { FinishedState } from "@epl/core";

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

/** `null` is two states a caller may render alike but must not conflate: a round
 *  in play, and one nobody has kicked off. `isMatchdayLive` is what separates
 *  them, and callers pair the two rather than this inventing a fourth answer. */
export type RoundState = "live" | FinishedState | null;

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
  // printed only at FPL's own sign-off. While bonus is still landing the screen
  // says full time *and* says why the totals are still shifting — a manager
  // watching his score change under the word Final would be right to stop
  // believing the screen.
  return (
    <span className="inline-flex items-baseline gap-1.5">
      {state === "final" ? "Final" : "Full time"}
      {state === "bonus-settling" ? (
        <span className="font-normal normal-case tracking-normal opacity-75">bonus settling</span>
      ) : null}
    </span>
  );
}
