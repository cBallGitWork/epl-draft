import { LEAGUE_NAME, SEASON } from "@epl/core";
import LeagueCrest from "../shell/LeagueCrest";
import { londonDate } from "../../londonTime";

// The paper's own name, set the way a paper sets it.
//
// A masthead, not a page header. Every other section of the app opens with the
// crest at the left and the title beside it, because those are screens. This is
// a front page, and the furniture is the difference: an edition line above the
// title, a heavy rule under it, and a strip below carrying the paper's standing
// line and a cover price. None of that is decoration — it is what a reader
// recognises before reading a word, and no app has any of it.
//
// The price is real, in the sense that it is fixed and printed and nobody pays
// it. A paper has one; this one costs nothing and says so.

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
      {/* The edition line: what day this is and which season, in the small caps
          a paper puts above its own name. */}
      <div className="flex items-baseline justify-between gap-3 font-sans text-2xs font-bold uppercase tracking-[0.18em]">
        <span>{at === null ? LEAGUE_NAME : londonDate(at)}</span>
        <span className="numeric">{SEASON}</span>
      </div>

      {/* Thick over the name, as a masthead is fenced. In the league's red,
          which is the one register this page leads in. */}
      <div className="mt-1.5 h-0.5 bg-league" />

      <div className="flex items-end justify-between gap-3 pt-2.5">
        <h1 className="paper-masthead text-balance">{LEAGUE_NAME}</h1>
        <LeagueCrest variant="mark" height={38} />
      </div>

      {/* The standing line and the price, ruled top and bottom — the strip every
          paper runs under its title. */}
      <div
        className="mt-2.5 flex items-baseline justify-between gap-3 border-y py-1 font-sans text-2xs font-semibold uppercase tracking-[0.15em]"
        style={{ borderColor: "currentColor" }}
      >
        <p className="italic opacity-75">Sixteen managers, one league, every week</p>
        <p className="opacity-75">Free</p>
      </div>

      <p className="pt-3 text-center text-sm italic opacity-70">{line}</p>
    </header>
  );
}
