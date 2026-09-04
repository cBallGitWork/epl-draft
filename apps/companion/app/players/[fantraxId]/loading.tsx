import Skeleton from "../../components/shell/Skeleton";

// One player, waiting on Fantrax — and it covers all four of his views, because
// a `loading.tsx` serves its segment and everything under it.
//
// So what it reserves is the CHROME the four share and nothing below it: the
// plated bar, the tab strip, the caption. Those three are the same height on
// every tab, which is what makes reserving them honest — the block under them is
// a different shape on each, and a skeleton that guessed at one would settle the
// page and then move it again.
//
// **The heights are the shell's, not invented.** `PageHeader`'s bar is
// `min-h-16` on a phone and `min-h-24` above `lg`; `.cm-tab` is 2.75rem and
// 3.5rem; `Caption` is its text plus `py-1.5`. This file used to describe the
// screen before the tabs — a 112px portrait beside a heading, then three blocks
// of name-and-value rows — which had stopped being true of anything.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-2">
      {/* The plated bar. Full width, because it is a plate rather than a title
          sitting on the page. */}
      <Skeleton width="100%" height="4rem" />

      {/* Four tabs sharing the row, at the plate's own height. */}
      <div className="flex gap-px">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex-1">
            <Skeleton width="100%" height="2.75rem" />
          </div>
        ))}
      </div>

      {/* The caption's own box. */}
      <Skeleton width="100%" height="2rem" />

      {/* One block under it, no taller than the shortest view's, so nothing
          reserves room a tab will not fill. */}
      <Skeleton width="100%" height="9rem" />
    </div>
  );
}
