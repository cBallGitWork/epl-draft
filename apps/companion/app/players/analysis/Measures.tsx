import type { Attribute } from "@epl/core";
import Section from "../../components/shell/Section";
import { DASH } from "@epl/core";

// The two men's ratings against each other, on Championship Manager's own grid.
//
// **No name row.** Craig, 10 Sep 2026: *"remove Haaland / João Pedro row under
// the big cm trow"*. The bar above is each man on his club's plate with his name
// on it, so a header repeating both names under it is the same fact twice — and
// the columns are identified by the thing they sit under.
//
// **Figure · label · figure**, mirrored about the name of the measure — CM's
// attribute grid is a label and a number; a comparison is that grid read twice
// with one set of labels, which is the shape every side-by-side in the reference
// takes and the shape that fits a 390 phone without scrolling — three columns,
// not forty-eight.
//
// **The better of the two is the LOUDER**, which is `docs/ui/player.md`'s rule
// for the single grid and it carries over unchanged: a step down in loudness
// rather than a second hue. Red is refused there and refused here —
// `--color-bad` means *a loss, a doubt, a negative*, and a 19 painted with it
// inverts the slot the rest of the app leans on. A player is not a fault for
// being the weaker of two.
//
// **Rows align by NAME, never by index.** A keeper's grid and an outfielder's
// hold different rows (each row's `for` in `football/attributes.ts`), so zipping two arrays
// position by position would print a keeper's Reflexes against a striker's
// Finishing under whichever label came first. A measure only one of them has is
// still a row, with a dash on the other side — that is a real answer about a
// keeper next to a forward, and dropping it would silently shorten the grid.

export default function Measures({
  a,
  b,
  names,
}: {
  a: readonly Attribute[];
  /** Empty when only one man is being looked at. */
  b: readonly Attribute[];
  names: { a: string; b: string | null };
}) {
  const alone = names.b === null;
  const rows = align(a, alone ? [] : b);
  if (rows.length === 0) return null;

  return (
    <Section title="Attributes" aside="Ours, 1–20, per 90">
      {/* The ledger's shape: centred and narrow, each pair either side of its label (Craig, 24 Sep 2026). */}
      <table className="mx-auto w-full max-w-sm border-collapse">
        <caption className="sr-only">
          {alone
            ? `${names.a} by every attribute he has`
            : `${names.a} and ${names.b} by every attribute either of them has`}
        </caption>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.name}|${row.from}`} className="border-b border-line/60 last:border-b-0">
              <td className={`${FIGURE} pr-3 text-right ${loudness(row.a, row.b)}`}>{row.a ?? DASH}</td>
              {/* The measure's own name, and its derivation in the `title` — the
                  single grid does the same, and DESIGN §7's amendment is why it
                  is a tooltip rather than a printed byline: a screen whose every
                  row is captioned with its source reads as a spreadsheet's
                  footnotes rather than as Championship Manager. */}
              <td
                title={row.from}
                className={`w-px whitespace-nowrap px-1 text-2xs uppercase text-muted ${alone ? "text-left" : "text-center"}`}
              >
                {row.name}
              </td>
              {alone ? null : (
                <td className={`${FIGURE} pl-3 text-left ${loudness(row.b, row.a)}`}>{row.b ?? DASH}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

const FIGURE = "numeric cm-row py-1 text-base lg:text-lg";

/** One measure, as both of them have it. */
interface Row {
  name: string;
  from: string;
  a: number | null;
  b: number | null;
}

/** Every measure either man has, in the order the first one's grid gives them,
 *  with the second's own extras appended.
 *
 *  Keyed on the name and what it is measured from, because that is the only handle the two grids
 *  share (see the file header on why index would be wrong), and a keeper's Positioning is not an
 *  outfielder's. */
function align(a: readonly Attribute[], b: readonly Attribute[]): Row[] {
  const handle = (attribute: Attribute) => `${attribute.name}|${attribute.from}`;
  const second = new Map(b.map((attribute) => [handle(attribute), attribute]));
  const rows: Row[] = a.map((attribute) => ({
    name: attribute.name,
    from: attribute.from,
    a: attribute.rating,
    b: second.get(handle(attribute))?.rating ?? null,
  }));

  const first = new Set(a.map(handle));
  for (const attribute of b) {
    if (first.has(handle(attribute))) continue;
    rows.push({ name: attribute.name, from: attribute.from, a: null, b: attribute.rating });
  }
  return rows;
}

/** How loudly one side's figure is set, against the other's.
 *
 *  The three rungs are `player.md`'s: `--color-mid` for the better, `--color-ink`
 *  for a tie, and `--color-muted` for the weaker. A missing rating is quieter
 *  still and is not a loss — he has not played the ninety minutes the rate needs,
 *  which is a different statement from being worse at it. */
function loudness(mine: number | null, theirs: number | null): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  return mine > theirs ? "font-bold text-mid" : "text-muted";
}
