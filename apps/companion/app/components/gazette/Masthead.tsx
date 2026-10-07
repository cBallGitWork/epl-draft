import { LEAGUE_NAME, SEASON, londonDate } from "@epl/core";
import { PAPER_NAME } from "../../config";

// The masthead: a rule, the league as publisher in small capitals, the paper's title, and a fenced dateline.

export default function Masthead({
  /** The snapshot's instant, not the reader's clock, so one cached edition carries one date; null when undated. */
  at,
}: {
  at: string | null;
}) {
  return (
    <header className="flex flex-col">
      {/* The rule a paper opens on, in ink like every rule on the sheet. */}
      <div className="h-[3px] bg-current" />

      <p className="pt-2 text-center font-sans text-3xs font-semibold uppercase tracking-[0.22em] text-muted">
        {LEAGUE_NAME}
      </p>

      {/* Allowed to wrap rather than shrink. */}
      <h1 className="paper-masthead text-balance pt-0.5 text-center">{PAPER_NAME}</h1>

      {/* The dateline, fenced: date at the left, season at the right. */}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-y-2 py-1 font-sans text-3xs font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "currentColor" }}>
        <span>{at === null ? LEAGUE_NAME : londonDate(at)}</span>
        <span className="numeric">{SEASON}</span>
      </div>
    </header>
  );
}
