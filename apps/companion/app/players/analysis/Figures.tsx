import { rateRows } from "./rates";
import type { Played, RateRow } from "./rates";
import { DASH, fixed } from "@epl/core";

// What the men have done, per ninety minutes, figure · label · figure. No section head and no name row (Craig,
// 10 Sep 2026): the rate is in each label. `Measures`' shape, copied (the second), with decimals and a direction.

export default function Figures({
  a,
  b,
  names,
  window,
}: {
  a: Played | null;
  /** Null when only one man is being looked at. */
  b: Played | null;
  names: { a: string; b: string | null };
  /** What the figures cover, for a screen reader: "this season" or "gameweeks 1 to 5". */
  window: string;
}) {
  const alone = names.b === null;
  const rows = rateRows(a, alone ? null : b);
  if (rows.length === 0) return null;

  return (
    // Centred and narrow, so each pair of figures sits either side of its label (Craig, 24 Sep 2026).
    <table className="mx-auto w-full max-w-sm border-collapse">
      <caption className="sr-only">
        {alone
          ? `${names.a} by what he has done, ${window}, per ninety minutes`
          : `${names.a} and ${names.b} by what each has done, ${window}, per ninety minutes`}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-line/60 last:border-b-0">
            <td className={`${FIGURE} pr-3 text-right ${loudness(row.a, row.b, row.name)}`}>{show(row)}</td>
            {/* The measure's name, its derivation in the `title` (DESIGN §7's provenance as a tooltip). */}
            <td
              title={row.from}
              className={`w-px whitespace-nowrap px-1 text-2xs uppercase text-muted ${alone ? "text-left" : "text-center"}`}
            >
              {label(row)}
            </td>
            {alone ? null : (
              <td className={`${FIGURE} pl-3 text-left ${loudness(row.b, row.a, row.name)}`}>{show(row, "b")}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const FIGURE = "numeric cm-row py-1 text-base lg:text-lg";

/** The measures where the lower figure is the better one: a defender wants his xGC low. */
const LOWER_IS_BETTER = new Set(["xGC"]);

/** The measure's name, carrying its rate: `xG/90`, since 0.82 could also be a season's total. */
function label(row: RateRow): string {
  return row.perNinety ? `${row.name}/90` : row.name;
}

/** A figure as printed: rates to two places whatever the value, denominators whole, absence a dash. */
function show(row: RateRow, side: "a" | "b" = "a"): string {
  const value = row[side];
  if (value === null) return DASH;
  return row.perNinety ? fixed(value, "perNinety") : String(value);
}

/** How loudly one side's figure is set against the other's: the better amber, a tie or a lone man ink, the weaker
 *  muted, a missing figure quieter still and never a loss. */
function loudness(mine: number | null, theirs: number | null, measure: string): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  const better = LOWER_IS_BETTER.has(measure) ? mine < theirs : mine > theirs;
  return better ? "font-bold text-mid" : "text-muted";
}
