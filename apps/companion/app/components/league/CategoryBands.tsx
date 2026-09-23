import type { CategoryBand, CategoryMan } from "@epl/core";
import Nothing from "../shell/Nothing";
import { PANEL } from "@/app/desk";
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
  mine,
  theirs,
  names,
  theirNames,
  withheld,
}: {
  bands: readonly CategoryBand[];
  /** The two managers, named once at the top rather than on every band. */
  mine: string;
  theirs: string;
  names: Names;
  theirNames: Names;
  /** The panel saying a side's lineup is not public yet, or null.
   *
   *  **Drawn once and full width, not per band.** With both sides in one object
   *  there is no per-side slot for it, and a silently empty column reads as "he
   *  registered nothing" — which is false, and the opposite of what the gate is
   *  for. `Withheld` names the team itself, so which half it speaks for is
   *  unambiguous without any grid work. */
  withheld: React.ReactNode;
}) {
  return (
    <section className={PANEL}>
      <h2 className="sr-only">Where the points came from</h2>
      {withheld}
      {bands.length === 0 ? (
        <Nothing title="Nothing scored yet">
          Fantrax has priced no category for either squad this gameweek.
        </Nothing>
      ) : (
        // Capped for `MatchStats`' own reason: the reference board is a
        // proportion rather than a pixel width, and stretched to 1440 the same
        // markup puts a thousand pixels between the two figures and the row
        // stops reading as one row.
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {/* Whose column is whose, said once. Truncated rather than wrapped:
              a two-line heading over a stack of bands is a heading that has
              become a panel. */}
          <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-end gap-2 pb-1">
            <span className="truncate text-center text-3xs font-bold uppercase text-faint">
              {mine}
            </span>
            <span aria-hidden />
            <span className="truncate text-center text-3xs font-bold uppercase text-faint">
              {theirs}
            </span>
          </div>
          {bands.map((band) => (
            <Band key={band.code} band={band} names={names} theirNames={theirNames} />
          ))}
        </div>
      )}
    </section>
  );
}

function Band({
  band,
  names,
  theirNames,
}: {
  band: CategoryBand;
  names: Names;
  theirNames: Names;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-2">
        <Figure men={band.mine} />
        <span className="text-center text-2xs font-bold uppercase text-ink lg:text-sm">
          {band.name}
        </span>
        <Figure men={band.theirs} />
      </div>
      {band.mine.length === 0 && band.theirs.length === 0 ? null : (
        <div className="grid grid-cols-2 gap-2">
          <Men men={band.mine} names={names} align="text-left" />
          <Men men={band.theirs} names={theirNames} align="text-right" />
        </div>
      )}
    </div>
  );
}

/** One side's men in one band, most first.
 *
 *  **Equal points are re-sorted by NAME here**, and that is this layer's job
 *  rather than core's: core ties on `fantraxId`, which is stable and meaningless,
 *  and ties are the common case — every scorer of one goal is on the same figure.
 *  A reader scanning a band wants the alphabet, not Fantrax's ids. */
function Men({ men, names, align }: { men: readonly CategoryMan[]; names: Names; align: string }) {
  if (men.length === 0) return <div />;
  const named = [...men]
    .map((man) => ({ ...man, name: names.get(man.fantraxId) ?? DASH }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return (
    <ul className={`flex min-w-0 flex-col ${align}`}>
      {named.map((man) => (
        <li key={man.fantraxId} className="min-w-0 truncate text-2xs text-muted lg:text-xs">
          <span className="text-ink">{man.name}</span>{" "}
          {/* His own share, in brackets. A deduction carries its minus sign, for
              the reason the plate above does: DESIGN §8 spends the direction pair
              only where which WAY a figure went is the reason for printing it. */}
          <span className="numeric">({man.points})</span>
        </li>
      ))}
    </ul>
  );
}

/** One side's total in one category, on its plate.
 *
 *  **The plate owns its ink, and the cascade enforces it** (DESIGN §2: "no call
 *  site sets `text-*` on a grey or blue plate"). `.cm-index`'s `color` is
 *  declared UNLAYERED in `desk.css`, so a Tailwind utility — which is layered —
 *  cannot reach it. `CategoryCompare` shipped for an hour with a `text-bad`
 *  ternary on this plate and measured cream on all twelve figures, deductions
 *  included: the ternary was dead the moment it was written.
 *
 *  **One blue plate for both sides**, not the manager's colour: `MatchStats`
 *  records the contrast failure that came of grounding each plate in a side's
 *  primary, and the sides are told apart by which end they are at — exactly as
 *  the scoreline above already says.
 *
 *  Absence, not nought: `[]` is a side that never registered the category, and a
 *  0 here would be a claim the payload never made (DESIGN §7). The plate still
 *  holds its place — it is the spine of the row. */
function Figure({ men }: { men: readonly CategoryMan[] }) {
  const total = men.length === 0 ? null : men.reduce((sum, man) => sum + man.points, 0);
  return (
    <span className="cm-index numeric flex h-6 items-center justify-center font-bold lg:h-7">
      {total ?? DASH}
    </span>
  );
}
