import type { CategoryBand, CategoryMan } from "@epl/core";
import Nothing from "../shell/Nothing";
import { GROUP_PLATE, PANEL } from "@/app/desk";
import { DASH } from "@epl/core";

// Where the scoreline came from, and who put it there.
//
// The hole this fills is the one the board was opened with: a manager could see
// 29 against 18 and eleven faces, and nothing said which categories the points
// came out of — and then, once `CategoryCompare` answered that, nothing said
// which of his eleven had registered them. This is that board with its workings.
//
// **It absorbed `CategoryCompare` rather than sitting beside it.** That board was
// this one's head row and nothing else: the two side totals on their plates with
// the category name between them, which is Championship Manager's Match Stats
// layout (`cm9900/22.jpg`). A totals board and a men board as two tabs would be
// one object printed twice, and the second would be the first with more rows.
//
// **The label is the axis and the figures are its ends**, which is why the head
// is a three-column grid and not a table: a table would make one side the subject
// and the other a column, and a head-to-head has no subject.
//
// **The men are two INDEPENDENT columns, not paired rows.** Three of my scorers
// against one of his is the honest shape of a band, and pairing them by index
// would invent an alignment the payload never claimed — `Isak` opposite `Haaland`
// reads as a comparison of two men when it is a comparison of two sides.

/** What to call a man, by the id core holds. Built by the caller from the roster,
 *  because core deals in `fantraxId` and never in names.
 *
 *  **Built behind the lineup gate**, which is the load-bearing half: a side whose
 *  eleven is not public contributes no bands and therefore no names, and building
 *  its map anyway would leave the leak one edit away rather than impossible. */
export type Names = ReadonlyMap<string, string>;

export default function CategoryBands({
  bands,
  names,
  theirNames,
  withheld,
}: {
  bands: readonly CategoryBand[];
  names: Names;
  theirNames: Names;
  /** The panel saying a side's lineup is not public yet, or null: drawn once and full width, because an
   *  empty column would read as "he registered nothing". */
  withheld: React.ReactNode;
}) {
  return (
    // The match page's Fantasy report (`prem/match/[id]/Fantasy`): one category after another, each side's
    // total at its end of the plate, the URL's side on the left as on the scoreline.
    <section className={PANEL}>
      <h2 className="sr-only">Where the points came from</h2>
      {withheld}
      {bands.length === 0 ? (
        <Nothing title="Nothing scored yet">
          Fantrax has priced no category for either squad this gameweek.
        </Nothing>
      ) : (
        <div className="flex flex-col gap-2">
          {bands.map((band) => (
            <div key={band.code} className="flex flex-col">
              <h3 className={`${GROUP_PLATE} gap-2 lg:text-xs`}>
                <Figure men={band.mine} />
                <span className="min-w-0 truncate">{band.name}</span>
                <Figure men={band.theirs} />
              </h3>
              <div className="grid grid-cols-2 divide-x divide-line bg-surface">
                <Men men={band.mine} names={names} end />
                <Men men={band.theirs} names={theirNames} end={false} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** One side's men in one band, most first.
 *
 *  **Equal points are re-sorted by NAME here**, and that is this layer's job
 *  rather than core's: core ties on `fantraxId`, which is stable and meaningless,
 *  and ties are the common case — every scorer of one goal is on the same figure.
 *  A reader scanning a band wants the alphabet, not Fantrax's ids. */
function Men({ men, names, end }: { men: readonly CategoryMan[]; names: Names; end: boolean }) {
  const named = [...men]
    .map((man) => ({ ...man, name: names.get(man.fantraxId) ?? DASH }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return (
    <ul className="flex min-w-0 flex-col py-1">
      {named.map((man) => (
        <li
          key={man.fantraxId}
          className={`flex min-w-0 items-baseline gap-1 px-2 py-0.5 text-sm ${end ? "justify-end text-right" : "justify-start text-left"}`}
        >
          <span className="truncate font-chrome font-bold">{man.name}</span>
          <span className="numeric shrink-0 text-muted">({man.points})</span>
        </li>
      ))}
    </ul>
  );
}

/** One side's total in one category, in the plate's own ink; a dash where he registered none, never a nought. */
function Figure({ men }: { men: readonly CategoryMan[] }) {
  const total = men.length === 0 ? null : men.reduce((sum, man) => sum + man.points, 0);
  return <span className="numeric w-8 shrink-0 text-center text-xs">{total ?? DASH}</span>;
}
