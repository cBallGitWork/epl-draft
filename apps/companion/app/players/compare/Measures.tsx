import type { Attribute } from "@epl/core";
import Section from "../../components/shell/Section";

// The two men's ratings against each other, on Championship Manager's own grid.
//
// **Figure · label · figure**, mirrored about the name of the measure. CM's
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
// **Rows align by NAME, never by index.** A keeper's grid drops the seven
// measures about scoring and creating in open play and an outfielder's drops
// Handling and Reflexes (`football/attributes.ts`), so zipping two arrays
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
  b: readonly Attribute[];
  names: { a: string; b: string };
}) {
  const rows = align(a, b);
  if (rows.length === 0) return null;

  return (
    <Section title="Attributes" aside="Ours, 1–20">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {names.a} and {names.b} by every attribute either of them has
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
              <td className={`numeric cm-row py-1 text-right text-base ${loudness(row.a, row.b)}`}>
                {row.a ?? DASH}
              </td>
              {/* The measure's own name, and its derivation in the `title` — the
                  single grid does the same, and DESIGN §7's amendment is why it
                  is a tooltip rather than a printed byline: a screen whose every
                  row is captioned with its source reads as a spreadsheet's
                  footnotes rather than as Championship Manager. */}
              <td
                title={row.from}
                className="px-2 text-center text-2xs uppercase text-muted"
              >
                {row.name}
              </td>
              <td className={`numeric cm-row py-1 text-left text-base ${loudness(row.b, row.a)}`}>
                {row.b ?? DASH}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

const DASH = "—";

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
 *  Keyed on the name because that is the only handle the two grids share — see
 *  the file header on why index would be wrong. */
function align(a: readonly Attribute[], b: readonly Attribute[]): Row[] {
  const second = new Map(b.map((attribute) => [attribute.name, attribute]));
  const rows: Row[] = a.map((attribute) => ({
    name: attribute.name,
    from: attribute.from,
    a: attribute.rating,
    b: second.get(attribute.name)?.rating ?? null,
  }));

  const first = new Set(a.map((attribute) => attribute.name));
  for (const attribute of b) {
    if (first.has(attribute.name)) continue;
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
