import type { RoundState } from "@epl/core";

// Where the gameweek on screen stands, in one word; each caller sets its own size and weight.

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

  // "Final" promises the number has stopped moving, so it waits for FPL's own sign-off.
  // `bonus-settling` reads "Full time" like `provisional`: the totals are Fantrax's, whose scoring has no bonus.
  return <>{state === "final" ? "Final" : "Full time"}</>;
}
