import type { Attribute } from "@epl/core";
import Section from "../../components/shell/Section";
import { DASH } from "@epl/core";

// The two men's ratings on CM's grid, figure · label · figure, the better one louder and never red (Craig, 10 Sep 2026:
// no name row). Rows align by name, so a keeper's Reflexes never sit against a striker's Finishing.

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
              {/* The measure's name, its derivation in the `title` (DESIGN §7's provenance as a tooltip). */}
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

/** A step above the row default: DESIGN §6's fifth recorded exception, a ledger of two men's figures and nothing else. */
const FIGURE = "numeric cm-row py-1 text-base lg:text-lg";

/** One measure, as both of them have it. */
interface Row {
  name: string;
  from: string;
  a: number | null;
  b: number | null;
}

/** Every measure either man has, the first's order then the second's extras, keyed on name and source. */
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

/** How loudly one side's rating is set against the other's: the better amber, a tie ink, the weaker muted, and a
 *  rating only the other man has quieter still. */
function loudness(mine: number | null, theirs: number | null): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  return mine > theirs ? "font-bold text-mid" : "text-muted";
}
