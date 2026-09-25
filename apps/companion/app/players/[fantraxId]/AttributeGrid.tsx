import type { CSSProperties } from "react";
import type { Attribute } from "@epl/core";
import { DASH } from "@epl/core";
import Section from "../../components/shell/Section";

// Championship Manager 01/02's attribute grid (Craig, 25 Sep 2026: "more cm like"): alphabetical
// down three columns on a desk and two on a phone, CM's orange on the best, and its worded rows
// (Preferred Foot, Condition) at the foot of the last column. Each rating says what it is made of
// in its title.

/** A worded row under the ratings, as CM ends its grid. */
export interface GridWord {
  name: string;
  value: string | null;
  title: string;
}

export default function AttributeGrid({
  attributes,
  words,
  group,
}: {
  attributes: readonly Attribute[];
  words: readonly GridWord[];
  /** Who he is rated against, for the heading; null when that is the whole division. */
  group: string | null;
}) {
  const cells = [
    ...attributes.map((a) => ({ name: a.name, title: a.from, value: a.rating, ink: ink(a.rating) })),
    ...words.map((w) => ({ name: w.name, title: w.title, value: w.value, ink: w.value === null ? "text-faint" : "text-mid" })),
  ];
  const rows = { "--rows": Math.ceil(cells.length / 2), "--rows-lg": Math.ceil(cells.length / 3) } as CSSProperties;

  return (
    <Section title="Attributes" aside={group === null ? "Against the division" : `Against ${group}`}>
      <dl
        className="grid auto-cols-fr grid-flow-col gap-x-4 [grid-template-rows:repeat(var(--rows),auto)] lg:gap-x-6 lg:[grid-template-rows:repeat(var(--rows-lg),auto)]"
        style={rows}
      >
        {cells.map((cell) => (
          <div
            key={cell.name}
            className="flex min-h-7 items-baseline justify-between gap-2 border-b border-bg py-0.5"
          >
            <dt className="truncate text-sm text-ink lg:text-base" title={cell.title}>
              {cell.name}
            </dt>
            <dd className={`numeric text-sm font-bold lg:text-base ${cell.ink}`}>{cell.value ?? DASH}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** CM's reading of a 1–20: orange for the best, amber for good, then quieter. */
function ink(rating: number | null): string {
  if (rating === null) return "text-faint";
  if (rating >= 16) return "text-peak";
  if (rating >= 11) return "text-mid";
  return rating >= 6 ? "text-muted" : "text-faint";
}
