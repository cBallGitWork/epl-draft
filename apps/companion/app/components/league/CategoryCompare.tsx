import type { CategoryPair } from "@epl/core";
import Nothing from "../shell/Nothing";
import { PANEL } from "@/app/desk";

// Where the scoreline came from: the two squads' scoring, category by category.
//
// The hole this fills is the one the board was opened with — a manager could see
// 29 against 18 and eleven faces, and nothing on the screen said which eleven
// categories the eleven points came out of. The pitch and the list both answer
// "who is in it"; this is the only view that answers "why".
//
// **Championship Manager's Match Stats board** — `cm9900/22.jpg`, which sets the
// two sides' figures on plates down the outside with the label centred between
// them. The label is the axis and the figures are its ends, which is why this is
// a three-column grid and not a table: a table would make one side the subject
// and the other a column, and a head-to-head has no subject.
//
// **A second copy of `prem/match/[id]/MatchStats`, deliberately.** CODE_RULES §1:
// two occurrences are a coincidence and stay duplicated. They differ in what a
// row IS — that one's rows are Opta's counts for one football match, these are
// our league's scoring categories summed over fifteen men each — and the third
// caller is what will tell us which half is actually shared. Recorded in
// PLATFORM_NOTES.
//
// **The figures are Fantrax's; the sums are ours.** Every line went into
// `compareCategories` as a number Fantrax published and comes out added up, so
// DESIGN §7's provenance rule applies to the totals rather than to the rows: the
// caller labels the board and nothing here is ever headed `FPts`.

export default function CategoryCompare({
  rows,
  mine,
  theirs,
}: {
  rows: readonly CategoryPair[];
  /** The two managers, in the order the board draws them — left is the side the
   *  URL named, as everywhere else on this screen. Names rather than teams: this
   *  board does not colour by side (see `MatchStats` on why that broke the
   *  contrast floor) and so has no business holding the colours. */
  mine: string;
  theirs: string;
}) {
  // Absent, not a board of noughts. A round nobody has played has no categories,
  // and printing `0 Goals 0` is a claim about an afternoon that has not happened
  // (DESIGN §7).
  if (rows.length === 0) {
    return (
      <Nothing title="Nothing scored yet">
        Fantrax has priced no category for either squad this period.
      </Nothing>
    );
  }

  return (
    <section className={PANEL}>
      <h2 className="sr-only">Where the points came from</h2>
      {/* Capped for `MatchStats`' own reason: the reference board is a
          proportion rather than a pixel width, and stretched to 1440 the same
          markup puts a thousand pixels between the two figures and the row stops
          reading as one row. */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
        {/* Whose column is whose, said once at the top rather than repeated on
            every row. The names are truncated rather than wrapped: fifteen rows
            under a two-line heading is a heading that has become a panel. */}
        <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-end gap-2 pb-1">
          <span className="truncate text-center text-3xs font-bold uppercase text-faint">
            {mine}
          </span>
          <span aria-hidden />
          <span className="truncate text-center text-3xs font-bold uppercase text-faint">
            {theirs}
          </span>
        </div>
        {rows.map((row) => (
          <Row key={row.code} row={row} />
        ))}
      </div>
    </section>
  );
}

function Row({ row }: { row: CategoryPair }) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr_3.25rem] items-center gap-2">
      <Figure value={row.mine} />
      <span className="text-center text-2xs font-bold uppercase text-ink lg:text-sm">
        {row.name}
      </span>
      <Figure value={row.theirs} />
    </div>
  );
}

/** One side's total in one category, on its plate.
 *
 *  **The plate owns its ink, and the cascade enforces it** (DESIGN §2: "no call
 *  site sets `text-*` on a grey or blue plate"). `.cm-index`'s `color` is
 *  declared UNLAYERED in `desk.css`, so a Tailwind utility — which is layered —
 *  cannot reach it. This shipped for an hour with `value < 0 ? "text-bad" :
 *  "text-cream"` and measured 8.83:1 cream on all twelve figures, deductions
 *  included: the ternary was dead the moment it was written.
 *
 *  So a deduction is carried by its MINUS SIGN, which is the honest signal and
 *  the one a reader already knows. DESIGN §8 wants it that way in any case: the
 *  direction pair is spent only where which WAY a figure went is the reason for
 *  printing it, and "a ledger of scoring categories stays ink" is the example the
 *  entry gives.
 *
 *  **One blue plate for both sides**, and not the manager's colour: `MatchStats`
 *  records the contrast failure that came of grounding each plate in a side's
 *  primary, and the sides are told apart by which end they are at — exactly as
 *  the scoreline above already says. */
function Figure({ value }: { value: number | null }) {
  return (
    <span className="cm-index numeric flex h-6 items-center justify-center font-bold lg:h-7">
      {/* Absence, not nought: the row is here because the OTHER side registered
          this category, and a 0 on this plate would be a claim the payload never
          made (DESIGN §7). The plate still holds its place — it is the spine of
          the row. */}
      {value ?? "\u2014"}
    </span>
  );
}
