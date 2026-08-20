import { LEAGUE_NAME, SEASON } from "@epl/core";
import LeagueCrest from "../shell/LeagueCrest";
import { londonDate } from "../../londonTime";

// The paper's own name, in the league's register rather than the football one.
// Tim Hortons red and cream belong to our competition; Premier League colours
// belong to the real world and stay out of the front page's furniture.
//
// A masthead, not a page header. Every other section of the app opens with the
// crest at the left and the title beside it, because those are screens. This one
// is a front page: the name is centred and set as large as a phone allows, it
// sits between rules, and under it runs a dateline — the row every newspaper
// puts there and no app does. That row is the whole difference between a
// masthead and an `<h1>`.
//
// The name is allowed to wrap. "Tim Hortons Pro League" over two lines at this
// size is what a broadsheet does with a long title, and shrinking it to fit one
// line would trade the one piece of typography on the page that is meant to be
// loud for a tidiness nobody asked for.

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
      {/* Two rules, thick over thin, which is how a masthead is fenced off from
          the page. Both in the league's red — this is the one page where that
          register leads rather than marking a single row. */}
      <div className="h-1 bg-league" />
      <div className="mt-0.5 h-px bg-league/50" />

      <div className="flex flex-col items-center gap-2 pt-3">
        <LeagueCrest variant="mark" height={34} />
        <h1 className="text-balance text-center font-display text-3xl font-bold leading-[1.05] tracking-tight text-cream">
          {LEAGUE_NAME}
        </h1>
      </div>

      {/* The dateline. Small capitals, letterspaced, ruled above and below —
          date at the left, season at the right, the way a paper prints its
          edition line. */}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-y border-league/40 py-1 text-2xs uppercase tracking-widest text-faint">
        <span>{at === null ? LEAGUE_NAME : londonDate(at)}</span>
        <span className="numeric">{SEASON}</span>
      </div>

      <p className="pt-2.5 text-center text-sm text-muted">{line}</p>
    </header>
  );
}
