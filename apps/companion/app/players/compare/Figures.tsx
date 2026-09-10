import Section from "../../components/shell/Section";
import { rateRows } from "./rates";
import type { RateRow } from "./rates";
import type { SeasonTotals } from "@epl/core";

// What the two of them have done, per ninety minutes.
//
// **`Measures`' shape, and it is the second occurrence rather than the third.**
// Figure · label · figure, mirrored about the name of the measure — the same
// three columns, because a comparison of two men is three columns whatever is in
// them, and because the screen having one table shape rather than two is the
// point. Two is a coincidence (CODE_RULES §1), so the markup and the loudness
// ladder are COPIED rather than extracted, and the third occurrence is what will
// say what varies. It is already visible what might: this one carries two blocks
// and prints decimals, where `Measures` carries one and prints integers.
//
// **The better of the two is the LOUDER**, on `Measures`' own ladder and for its
// reason: a step down in loudness rather than a second hue. Red is refused —
// `--color-bad` means *a loss, a doubt, a negative*, and a player is not a fault
// for being the weaker of two.
//
// **Which end is better is per MEASURE, and two of them run the other way.**
// Goals conceded and expected goals conceded are figures a defender wants LOW,
// so lighting the higher one would praise the worse defence. `Measures` never
// had this problem — every attribute is out of twenty and up is good — which is
// why the ladder gains a direction here rather than being copied unchanged.

export default function Figures({
  a,
  b,
  names,
}: {
  a: SeasonTotals | null;
  b: SeasonTotals | null;
  names: { a: string; b: string };
}) {
  const rows = rateRows(a, b);
  if (rows.length === 0) return null;

  return (
    <Section title="This season" aside="FPL's own, per 90">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {names.a} and {names.b} by what each has done this season, per ninety minutes
        </caption>
        <thead>
          <tr className="border-b border-line text-2xs uppercase text-faint">
            <th scope="col" className="w-16 py-1 text-right font-bold lg:w-24">
              {names.a}
            </th>
            <th scope="col" className="py-1 text-center font-bold">
              &nbsp;
            </th>
            <th scope="col" className="w-16 py-1 text-left font-bold lg:w-24">
              {names.b}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-line/60 last:border-b-0">
              <td className={`numeric cm-row py-1 text-right text-base ${loudness(row.a, row.b, row.name)}`}>
                {show(row)}
              </td>
              {/* The measure's own name, its derivation in the `title` — DESIGN
                  §7's provenance rule as a tooltip rather than a printed byline.
                  `Measures` makes the same call and records why. */}
              <td title={row.from} className="px-2 text-center text-2xs uppercase text-muted">
                {row.name}
              </td>
              <td className={`numeric cm-row py-1 text-left text-base ${loudness(row.b, row.a, row.name)}`}>
                {show(row, "b")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

const DASH = "—";

/** The measures where the LOWER figure is the better one.
 *
 *  Written out literally rather than derived from a `mark` field on `Figure`,
 *  because there are two of them and a field carried by eleven rows to be read
 *  by two is a column of noise. The third one moves it onto the type. */
const LOWER_IS_BETTER = new Set(["xGC"]);

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
 *  rate needs, which is a different statement from being worse at it. */
function loudness(mine: number | null, theirs: number | null, measure: string): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  const better = LOWER_IS_BETTER.has(measure) ? mine < theirs : mine > theirs;
  return better ? "font-bold text-mid" : "text-muted";
}
