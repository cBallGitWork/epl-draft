import Link from "@/app/components/shell/Link";
import { isMeasure, type Measure } from "@epl/core";
import { SMALL_CAPS, heldPlate } from "@/app/desk";

// Which figure every cell on the board holds: one grey toggle over the board (Craig, 11 Sep 2026: "at the top, allow a
// toggle between fantasy points and actual raw values"). Grey, as DESIGN §2's pressable plate; the blue is navigation.
// A link, so the server orders and the choice survives a share.

/** Fantrax's two figures for what each lineup scored, or the stats league's counts for each squad's season. */
export type View = Measure | "squad";

export function viewFor(by: string | undefined): View {
  return by === "squad" ? by : isMeasure(by) ? by : "points";
}

/** The figures a cell can hold, in the order the plates stand. */
const VIEWS: readonly { by: View; label: string; title: string }[] = [
  { by: "points", label: "FPts", title: "What Fantrax paid for each category" },
  { by: "value", label: "Total", title: "The raw figure behind each category" },
  { by: "squad", label: "Squad", title: "What the men each team holds now have done all season, from the stats league" },
];

/** The control floor at both widths (DESIGN §6). */
const PLATE = `flex min-h-11 items-center px-3 ${SMALL_CAPS} lg:min-h-9`;

export default function Measures({
  view,
  href,
}: {
  view: View;
  /** Where each plate leads; the page spells its own query. */
  href: (view: View) => string;
}) {
  return (
    <div role="group" aria-label="Which figure the board shows" className="flex">
      {VIEWS.map((entry) => {
        const on = entry.by === view;
        return (
          <Link
            key={entry.by}
            href={href(entry.by)}
            title={entry.title}
            aria-pressed={on}
            // The plate owns its ink; a pressed plate takes no hover.
            className={`${heldPlate(on)} ${PLATE}`}
          >
            {/* The tick says the pressed state in a shape: the grey plate cannot carry the accent. */}
            {on ? (
              <span aria-hidden className="pr-1 text-[0.625rem] leading-none">
                ✓
              </span>
            ) : null}
            {entry.label}
          </Link>
        );
      })}
    </div>
  );
}
