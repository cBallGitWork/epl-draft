import LeagueShell from "./Shell";
import SkeletonRows from "../components/shell/SkeletonRows";

// The table, waiting on Fantrax.
//
// `LeagueShell` is the real one, so the header and the section nav are on screen
// and working before a row exists — a reader who wanted Schedule or Matchups can
// go there without waiting for the standings he did not come for. The column
// heads are the page's own words about what the columns mean and not part of the
// answer, so they print too.

export default function Loading() {
  return (
    <LeagueShell title="Table" current="table">
      <div aria-busy className="flex flex-col gap-3">
        <div className="flex items-center gap-3 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
          <span className="w-6">#</span>
          <span className="flex-1">Team</span>
          <span className="numeric w-16 text-right">W-L-T</span>
          <span className="numeric w-16 text-right">FP</span>
        </div>
        <SkeletonRows count={6} height="3.5rem" />
      </div>
    </LeagueShell>
  );
}
