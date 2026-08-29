import { LEAGUE_NAME, SEASON } from "@epl/core";
import LeagueCrest from "../shell/LeagueCrest";
import { PAPER_NAME, PAPER_STANDING_LINE } from "../../config";
import { londonDate } from "../../londonTime";

// The paper's own name, set the way a paper sets it.
//
// A masthead, not a page header. Every other section of the app opens with the
// crest at the left and the title beside it, because those are screens. This is
// a front page, and the furniture is the difference: the publisher's name in
// small capitals above the title, the title itself in the display face, a
// dateline fenced between two heavy rules, and a plate under it. None of that is
// decoration — it is what a reader recognises before reading a word, and no app
// has any of it.
//
// **The title is the paper's, and the line above it is the league's.** It used
// to set the league's name at masthead size, which is a screen announcing which
// app you are in. A masthead names the publication; the publisher is the small
// line over the top, the way it is on every front page ever printed.

export default function Masthead({
  line,
  /** When this edition was assembled. A dateline is a claim about *when*, so it
   *  is the snapshot's instant rather than the reader's clock — two managers
   *  opening the same cached edition either side of midnight must not be shown
   *  two different days. Null when there is no edition to date. */
  at,
}: {
  line: string;
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

      {/* The plate. A front page carries a picture under its title, and until
          somebody chooses a photograph this is the frame it will drop into with
          the mark printed in it — a crest is the one image we are certain of,
          which is the same argument the portraits make for a club badge over a
          wrong face.
          The crest is a colour plate and knows it: `.crest` restores the tokens
          `.paper` re-pointed at ink, so its cream ring and leaf stay cream on
          the league's red rather than being stamped red on red.

          The plate used to sit the mark on a solid red field a quarter of the
          box wide, which put the loudest colour on the page directly under the
          nameplate. The mark keeps its own red; the field it stands on is the
          stock, divided from the standing line by a rule — which is the frame
          the reference gives its photograph. */}
      <div className="mt-3 flex items-stretch border-2" style={{ borderColor: "currentColor" }}>
        <div
          className="flex w-24 shrink-0 items-center justify-center border-r-2 py-3"
          style={{ borderColor: "currentColor" }}
        >
          <LeagueCrest variant="mark" height={44} />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 px-3 py-2">
          <p className="text-sm italic leading-snug">{PAPER_STANDING_LINE}</p>
          {/* The price is real, in the sense that it is fixed and printed and
              nobody pays it. A paper has one; this one costs nothing and says
              so. */}
          <p className="font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-faint">
            Free
          </p>
        </div>
      </div>

      {/* The line that changes: football is on, or when lineups lock. */}
      <p className="pt-3 text-center text-sm italic text-muted">{line}</p>
    </header>
  );
}
