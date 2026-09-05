import LeagueShell from "../league/Shell";
import Skeleton from "../components/shell/Skeleton";
import { BUTTON } from "../components/shell/ButtonLink";

// The pool, waiting on Fantrax's 533 KB of stats.
//
// `LeagueShell` is the real one, so the bar, the section strip and the panel are
// on screen and working before a row exists — the same rule `league/loading`
// sets, and the reason this route stopped drawing a header of its own.
//
// The search box is real and works from the first frame: it is a GET form to
// this same route, so a reader who came here to find one player can type his
// name before the other six hundred have arrived. The status and position chips
// are the league's own vocabulary, read off the pool, so those are blocks.

export default function Loading() {
  return (
    <LeagueShell current="players" sub={<Skeleton width="10rem" height="0.75rem" />}>
      <form aria-busy action="/players" className="flex gap-1.5">
        <input
          name="q"
          placeholder="Find a player"
          aria-label="Find a player"
          className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base"
        />
        <button
          type="submit"
          className={BUTTON}
        >
          Find
        </button>
      </form>

      {/* Real plates with a bar in them, not blocks the shape of one. `cm-tab`
          owns the height, so these cannot drift from the chips that land in
          them the way a copied `2.75rem` did — and an empty bevelled tab is
          Championship Manager's own idiom for one with nothing in it yet
          (`cm9900/12.jpg`, the greyed "Unused" pair). */}
      <div className="flex flex-wrap gap-1.5">
        {["7rem", "6rem", "4rem"].map((width) => (
          <span key={width} className="cm-tab flex items-center px-3" style={{ width }}>
            <Skeleton width="100%" height="0.875rem" />
          </span>
        ))}
      </div>

      {/* The table's own row: a 32px mark on his club's colour, then his name.
          Inside the shell's panel like the real one, so the rows are the same
          width they will be — the gutter breakout went with the plate. */}
      <div aria-busy>
        {Array.from({ length: 8 }, (_, at) => (
          // Two bars, because the real row is two lines — his name over his
          // club — and a skeleton that draws one is a box the row pushes out of
          // the way when it lands. `min-h-[3.25rem]` was tuned to the row's old
          // 52px and went stale the moment `.cm-row` relaxed the desk; the shape
          // tracks it and a number cannot. The circle takes `--row-portrait`,
          // which is the portrait's own size at whichever width this is.
          <div key={at} className="cm-row flex min-h-11 items-center gap-2.5 border-b border-line/60">
            <Skeleton width="var(--row-portrait)" height="var(--row-portrait)" circle />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton width="40%" height="0.875rem" />
              <Skeleton width="22%" height="0.6875rem" />
            </div>
          </div>
        ))}
      </div>
    </LeagueShell>
  );
}
