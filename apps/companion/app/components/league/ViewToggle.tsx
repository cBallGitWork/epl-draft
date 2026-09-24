"use client";

import { TAB } from "@/app/desk";

// Which view of a squad you are looking at: the pitch or the list, as a quiet second strip on the squad, club
// and Team screens, which already carry a full-height one. The head-to-head's views are links (`views.ts`).
//
// `aria-current="page"` rather than `aria-pressed`, because `.cm-tab`'s yellow
// label-and-border is keyed off it in `desk.css` and a strip that had to be
// styled twice would be two strips.

export type View = "pitch" | "list";

/** What each view is called on its plate. */
const LABEL: Record<View, string> = {
  pitch: "Pitch",
  list: "List",
};

/** The plates, in the order the strip draws them. */
const BOTH: readonly View[] = ["pitch", "list"];

/** Always a SECOND strip on a screen that already has one, so its plates sit at the control floor (`.cm-tab-quiet`). */
export default function ViewToggle({ view, onPick }: { view: View; onPick: (view: View) => void }) {
  return (
    // The plates butt against each other and fill the row, as CM's own pair at a screen's foot does.
    <div role="group" aria-label="How to show the squad" className="flex flex-1">
      {BOTH.map((value) => (
        <ViewButton key={value} current={view} value={value} onPick={onPick} />
      ))}
    </div>
  );
}

function ViewButton({ current, value, onPick }: { current: View; value: View; onPick: (view: View) => void }) {
  const here = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-current={here ? "page" : undefined}
      // A class, not a `min-h-*` utility: `desk.css` comes last and a utility shrinking a `.cm-tab` writes nothing.
      className={`${TAB} cm-tab-quiet px-3 text-2xs`}
    >
      {LABEL[value]}
    </button>
  );
}
