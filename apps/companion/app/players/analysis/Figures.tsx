import { rateRows } from "./rates";
import type { RateRow } from "./rates";
import type { SeasonTotals } from "@epl/core";

// What the men have done, per ninety minutes.
//
// **No section head** (Craig, 10 Sep 2026: *"remove This season FPL's own, per
// 90 row"*). The provenance it carried has not been dropped, it has moved onto
// the labels where it belongs: a row reading `XG/90` says both things at the
// point of use, which is what DESIGN §7 asks for and what a heading two inches
// above the figure never quite does.
//
// **No name row either** (*"remove Haaland / João Pedro row under the big cm
// trow"*). The bar above the table is each man on his club's plate with his name
// on it; a header repeating both names under it is the same fact a second time,
// and the columns are already identified by the thing they sit under.
//
// **`Measures`' shape, and it is the second occurrence rather than the third.**
// Figure · label · figure, mirrored about the name of the measure. Two is a
// coincidence (CODE_RULES §1), so the markup and the loudness ladder are COPIED,
// and the third occurrence is what will say what varies. Two differences are
// already visible: this one prints decimals, and it collapses to two columns for
// a single player.
//
// **Which end is better is per MEASURE, and one of them runs the other way.**
// Expected goals conceded is a figure a defender wants LOW, so lighting the
// higher one would praise the worse defence. `Measures` never had this problem —
// every attribute is out of twenty and up is good — which is why the ladder
// gains a direction here rather than being copied unchanged.

export default function Figures({
  a,
  b,
  names,
}: {
  a: SeasonTotals | null;
  /** Null when only one man is being looked at, which is a first-class state
   *  here rather than half of a broken comparison. */
  b: SeasonTotals | null;
  names: { a: string; b: string | null };
}) {
  const alone = names.b === null;
  const rows = rateRows(a, alone ? null : b);
  if (rows.length === 0) return null;

  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">
        {alone
          ? `${names.a} by what he has done this season, per ninety minutes`
          : `${names.a} and ${names.b} by what each has done this season, per ninety minutes`}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-line/60 last:border-b-0">
            <td
              className={`numeric cm-row w-16 py-1 text-right text-base lg:w-24 ${loudness(row.a, row.b, row.name)}`}
            >
              {show(row)}
            </td>
            {/* The measure's own name, its derivation in the `title` — DESIGN
                §7's provenance rule as a tooltip rather than a printed byline.
                `Measures` makes the same call and records why. */}
            <td
              title={row.from}
              className={`px-2 text-2xs uppercase text-muted ${alone ? "text-left" : "text-center"}`}
            >
              {label(row)}
            </td>
            {alone ? null : (
              <td
                className={`numeric cm-row w-16 py-1 text-left text-base lg:w-24 ${loudness(row.b, row.a, row.name)}`}
              >
                {show(row, "b")}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const DASH = "—";

/** The measures where the LOWER figure is the better one.
 *
 *  Written out literally rather than derived from a field on `Rate`, because
 *  there is one of them and a field carried by eleven rows to be read by one is
 *  a column of noise. The third one moves it onto the type. */
const LOWER_IS_BETTER = new Set(["xGC"]);

/** The measure's name, carrying its own rate.
 *
 *  `XG/90` rather than `XG` under a heading saying "per 90": the heading came off
 *  on 10 Sep 2026 and the distinction it was making is not decoration. An xG of
 *  0.82 is a rate and an xG of 0.82 is also a plausible season total, and only
 *  the label says which one a reader is looking at. */
function label(row: RateRow): string {
  return row.perNinety ? `${row.name}/90` : row.name;
}

/** A figure as it is printed: rates to two places, denominators whole.
 *
 *  **The MEASURE decides, not the value.** A rate that happens to land on a
 *  whole number is still a rate, and `Number.isInteger` set Haaland's nought
 *  tackles and two bonus points as `0` and `2` in a column of `0.82` and
 *  `35.33`. A column of figures that do not agree about their own precision
 *  reads as a column with something wrong in it.
 *
 *  Absence is a dash and never a nought (DESIGN §7) — and it means one of two
 *  things here, both of them honest: we have no season for him at all, or he has
 *  not played the ninety minutes a rate needs. */
function show(row: RateRow, side: "a" | "b" = "a"): string {
  const value = row[side];
  if (value === null) return DASH;
  return row.perNinety ? value.toFixed(2) : String(value);
}

/** How loudly one side's figure is set, against the other's.
 *
 *  The rungs are `player.md`'s and `Measures`': `--color-mid` for the better,
 *  `--color-ink` for a tie, `--color-muted` for the weaker. A missing figure is
 *  quieter still and is NOT a loss — he has not played the ninety minutes the
 *  rate needs, which is a different statement from being worse at it.
 *
 *  **A man on his own is never the weaker of two.** With nobody opposite, every
 *  figure takes plain ink: there is no comparison to lose, and dimming half a
 *  lone player's numbers would invent one. */
function loudness(mine: number | null, theirs: number | null, measure: string): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  const better = LOWER_IS_BETTER.has(measure) ? mine < theirs : mine > theirs;
  return better ? "font-bold text-mid" : "text-muted";
}
