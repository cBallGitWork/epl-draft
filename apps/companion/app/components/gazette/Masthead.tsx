import { LEAGUE_NAME, SEASON, londonDate } from "@epl/core";
import { PAPER_NAME } from "../../config";

// The paper's own name, set the way a paper sets it.
//
// A masthead, not a page header. Every other section of the app opens with the
// crest at the left and the title beside it, because those are screens. This is
// a front page, and the furniture is the difference: the publisher's name in
// small capitals above the title, the title itself in the display face, and a
// dateline fenced between two heavy rules. None of that is decoration — it is
// what a reader recognises before reading a word, and no app has any of it.
//
// **Four rows and then the paper starts.** It carried two more until 3 Sep 2026
// and both are gone on Craig's ruling. A PLATE — the crest in a ruled box beside
// "No. 2" and "Free" — took a fifth of a phone screen to say the crest at the
// top of every other tab already says, and an edition number and a price nobody
// pays are furniture pretending to be facts. And a STANDING LINE under it, which
// said either "Football is on. The scores are moving." or when lineups lock;
// both are stated by something that is already on the page — the scoreboard
// strip appears exactly when football is on, and *Next deadline* in the sidebar
// carries the lock to the minute. A masthead that repeats the page is a masthead
// paying for itself twice.
//
// **The title is the paper's, and the line above it is the league's.** It used
// to set the league's name at masthead size, which is a screen announcing which
// app you are in. A masthead names the publication; the publisher is the small
// line over the top, the way it is on every front page ever printed.

export default function Masthead({
  /** When this edition was assembled. A dateline is a claim about *when*, so it
   *  is the snapshot's instant rather than the reader's clock — two managers
   *  opening the same cached edition either side of midnight must not be shown
   *  two different days. Null when there is no edition to date. */
  at,
}: {
  at: string | null;
}) {
  return (
    <header className="flex flex-col">
      {/* The rule a paper opens on. Ink, like every other rule on the sheet:
          the reference prints its whole front page in two colours, and a
          coloured band across the top is the first thing that breaks it. */}
      <div className="h-[3px] bg-current" />

      <p className="pt-2 text-center font-sans text-3xs font-semibold uppercase tracking-[0.22em] text-muted">
        {LEAGUE_NAME}
      </p>

      {/* Allowed to wrap. Two lines at this size is what a broadsheet does with
          a long title, and shrinking it to fit would trade the one piece of
          typography meant to be loud for a tidiness nobody asked for. */}
      <h1 className="paper-masthead text-balance pt-0.5 text-center">{PAPER_NAME}</h1>

      {/* The dateline, fenced. Date at the left and season at the right, in
          letterspaced small capitals — that row is the whole difference between
          a masthead and an `<h1>`. */}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-y-2 py-1 font-sans text-3xs font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "currentColor" }}>
        <span>{at === null ? LEAGUE_NAME : londonDate(at)}</span>
        <span className="numeric">{SEASON}</span>
      </div>
    </header>
  );
}
