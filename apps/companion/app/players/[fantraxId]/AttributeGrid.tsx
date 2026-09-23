import type { Attribute } from "@epl/core";
import Section from "../../components/shell/Section";
import { DASH } from "@epl/core";

// Championship Manager's attribute grid: three columns of `label · rating`,
// read down each column in turn (`cm9900/11.jpg`).
//
// **Three columns on the desk, two on a phone, and never one.** CM draws three
// across 800px and docs/rules/PRODUCT.md's rule is that the desk decides what is on the
// screen and the phone decides how much of it a thumb gets — not that the phone
// gets a stretched column of the same thing. A single column would put fifteen
// rows down a page that already scrolls; two keeps the shape recognisable at
// 390.
//
// **Set at `xs`/`sm`, where DESIGN §6's density table puts a figure in a row at
// `2xs`.** This is a departure and not a precedent: `SeasonGrid`, which is the
// app's other CM-style grid, sets its figures at `2xs` like everything else, so
// there is no existing exception to cite. The reason for this one is that a
// figure in a ROW sits beside a name and is read second, while every figure here
// is what the reader came for — at 11px against CM's own 13 the grid read as a
// caption under the portrait. If §6 should carry the exception, that is a
// docs/rules/DESIGN.md edit and Craig's call, not this file's.
//
// **The ratings are AMBER, not yellow, and that is the one place this screen
// deliberately departs from the reference.** CM sets them in its own yellow. In
// our palette yellow is `--color-accent` and means *yours · selected · active*
// (DESIGN §3), and a grid of thirty numbers all reading "active" would spend the
// slot on nothing. `--color-mid` is the slot whose one meaning is "a figure",
// which is what every one of these is.
//
// **And the good ones are the loud ones** (Craig, 4 Sep 2026: *"good attributes
// - give a orange/red colouring"*). The ramp is a step down in LOUDNESS rather
// than a second hue: `--color-mid` — amber, and the warmest ink in the set — for
// the top of the scale, then `--color-muted`, then `--color-faint`. Red was the
// obvious reading of "orange/red" and is refused: `--color-bad`'s one meaning is
// *a loss, a doubt, a negative*, and painting a 19 with it would invert the one
// slot the rest of the app relies on to mean the opposite.
//
// **No provenance line and no derivation paragraph** (Craig, same: *"remove this
// row text"* and *"Ours, derived - and that text"*). Both were here on DESIGN
// §7's instruction — provenance at the point of use — and their removal is an
// amendment to that rule rather than an oversight of it; docs/rules/DESIGN.md records it
// with the date. What each rating is made of survives on each row's `title`.

export default function AttributeGrid({
  attributes,
}: {
  attributes: readonly Attribute[];
}) {
  return (
    // **The provenance is visible, not a tooltip.** This shipped for one commit
    // with an `sr-only` heading and the derivation only in `title=`, which is no
    // provenance at all on the phone this app is designed for — and it left the
    // most derived object on the screen as the one block without a line saying
    // whose it is, beside two headed "FPL's own" and one headed "Fantrax's own".
    // Fifteen CM-shaped 1-20s next to a Premier League portrait read as Sports
    // Interactive's, which is the single reading `attributes.ts` exists to
    // refuse. DESIGN §7: provenance at the point of use.
    <Section title="Attributes">
      <dl className="grid grid-cols-2 gap-x-4 lg:grid-cols-3">
        {attributes.map((attribute) => (
          <div
            key={attribute.name}
            // A row of a list, not a control: 28px on the desk, and on a phone
            // it stays a row rather than growing to the 44px tap floor, because
            // nothing here is tappable. DESIGN §6 — "a row relaxes and a control
            // never does" — and the floor is a rule about a thumb.
            className="flex min-h-6 items-baseline justify-between gap-2 border-b border-bg py-0.5 lg:min-h-7"
          >
            {/* Fantrax's own wording is not involved here — the provenance is
                ours, and `title` carries what the number was derived from so a
                manager can ask "on what?" of any row. */}
            <dt
              className="truncate text-xs text-muted lg:text-sm"
              title={attribute.from}
            >
              {attribute.name}
            </dt>
            <dd className={`numeric text-xs font-bold lg:text-sm ${ink(attribute.rating)}`}>
              {/* Absence is a dash, never a nought — DESIGN §7. A man under the
                  minutes floor has not been measured, and a 1 would say he was
                  measured and found to be the worst in the division. */}
              {attribute.rating ?? DASH}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** How loud a rating is drawn, on the 1&ndash;20 scale CM uses.
 *
 *  Thresholds rather than a gradient: fifteen shades of amber is not a reading,
 *  and CM's own grid is legible because a value is either notable or it is not.
 *  15 is the top quarter of the scale and 8 the bottom half of the middle. */
function ink(rating: number | null): string {
  if (rating === null) return "text-faint";
  if (rating >= GOOD) return "text-mid";
  return rating >= ORDINARY ? "text-muted" : "text-faint";
}

const GOOD = 15;
const ORDINARY = 8;
