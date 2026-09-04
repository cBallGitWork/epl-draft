import type { LabelledValue } from "@epl/core";
import { FACT } from "@/app/desk";
import Section from "../../components/shell/Section";

// One block of name-and-value rows, under a heading that says whose they are.
//
// **Four provenances arrive inside one Fantrax payload and they are not
// interchangeable** — `getPlayerProfile` splits into our league's row, Fantrax's
// own rankings, the whole-of-Fantrax market, and the man himself. DESIGN §7 says
// every derived figure states whose it is, so they render as separate blocks
// under separate headings rather than as one list. That split used to be the
// fault this screen was known for: four stacked lists with nothing choosing
// between them. The tabs choose now, and each block sits under the question it
// answers.
//
// Local to this route on purpose. It is one component with one shape and four
// callers inside the same folder; `CODE_RULES §4` moves a component to a shared
// directory at the third occurrence ACROSS routes, and this has one.
//
// **It wears `Section` rather than its own heading.** It had a bare `LABEL` h2,
// which put a string on the photograph on every tab that used it — invisible
// until `groundfit.mjs` was repaired on 4 Sep 2026. `Section` is where the plate
// lives now, and one heading idiom is better than two.

/** Renders nothing when the block is empty — a heading over no rows is a claim
 *  that something is missing. */
export default function Facts({
  title,
  note,
  rows,
  without = [],
}: {
  title: string;
  note?: string;
  rows: readonly LabelledValue[];
  /** Labels to drop, for a block whose caller already prints them elsewhere on
   *  the same screen (Craig, 4 Sep 2026: "You have birthdate and age twice,
   *  remove that row"). Fantrax's labels, because they are Fantrax's rows — the
   *  list is a filter on their vocabulary and not a translation of it. */
  without?: readonly string[];
}) {
  const shown = rows.filter((row) => !without.includes(row.label));
  if (shown.length === 0) return null;
  return (
    <Section title={title}>
      {note ? <p className="text-2xs text-faint">{note}</p> : null}
      {/* Columns on the desk, one stack on a phone. A `FACT` row is a label
          and a figure pushed to opposite ends, so a full-width one at 1440 puts
          900px of nothing between "Birthplace" and "Sheffield" — a phone layout
          stretched, which is the fault PRODUCT.md names when it says the desk is
          drawn first. */}
      <dl className="flex flex-col gap-1 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {shown.map((row) => (
          <div key={row.label} className={FACT}>
            {/* Fantrax's short label, with their own longer wording behind it.
                The long form is a full sentence on some rows and would wrap to
                three lines on a phone. */}
            <dt
              className="min-w-0 flex-1 truncate text-sm text-muted"
              title={row.description ?? undefined}
            >
              {row.label}
            </dt>
            <dd className="numeric font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
