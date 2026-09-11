import Skeleton from "../../../components/shell/Skeleton";

// One head-to-head, waiting on both elevens.
//
// **No `LeagueShell`, because the page has none.** It wrapped in one until
// 11 Sep 2026 while the page it stands in for had dropped the competition bar,
// the section strip and the caption on 5 Sep — so the skeleton drew 114px of
// chrome that then vanished, and every object on the screen jumped up by it the
// moment the real board arrived. A skeleton that does not match its page is a
// layout shift with extra steps.
//
// The shapes are the board's own: the scoreline, the four-plate tab strip, and
// the grass — which is the tall thing, drawn at roughly the height the eleven and
// the bench take on a phone so the strip above does not travel when they arrive.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-2">
      <div className="flex items-stretch gap-px">
        <Skeleton width="50%" height="4rem" />
        <Skeleton width="50%" height="4rem" />
      </div>

      {/* **The real plate, not a number copied off it.** `.cm-tab` is 2.75rem
          under a thumb and 3.5rem above `lg`, and `desk.css` puts the height on
          the class precisely so a skeleton can wear it — a hardcoded `2.75rem`
          here gave the desk 12px of shift when the strip landed, in the file
          whose whole point is not doing that. */}
      <div className="flex gap-px">
        {["scores", "stats", "players", "report"].map((view) => (
          <span key={view} aria-hidden className="cm-tab flex-1 animate-pulse bg-current/15" />
        ))}
      </div>

      <div className="bleed">
        <Skeleton width="100%" height="26rem" />
      </div>
    </div>
  );
}
