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

export default function ViewToggle({
  view,
  onPick,
  quiet = false,
}: {
  view: View;
  onPick: (view: View) => void;
  /** Whether this is a SECOND strip on a screen that already has one. Drops the
   *  plate to the control floor, which is what `.cm-tab-quiet` means. */
  quiet?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="How to show the squad"
      // The plates butt against each other, which is how CM draws a strip; the
      // box-with-a-gap around them was a modern segmented control. **And they
      // fill the row** — CM's own pair at the foot of a screen (`Back` · `Next`)
      // spans it, and two content-width plates floating at the left of an empty
      // bar read as leftovers rather than as a control.
      // `flex-1` so it fills the row wherever it is put: inert in a block parent,
      // where the strip is block-level and fills anyway, and load-bearing in the
      // one caller that shares its row with something else.
      className="flex flex-1"
    >
      {BOTH.map((value) => (
        <ViewButton key={value} current={view} value={value} onPick={onPick} quiet={quiet} />
      ))}
    </div>
  );
}

function ViewButton({
  current,
  value,
  onPick,
  quiet,
}: {
  current: View;
  value: View;
  onPick: (view: View) => void;
  quiet: boolean;
}) {
  const here = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      // The tab you are on, in the markup `.cm-tab` reads. `aria-current` is
      // valid on any element and says the right thing about a strip: this is the
      // one you are on, not a switch you are holding down.
      aria-current={here ? "page" : undefined}
      // The modifier is a CLASS and not a `min-h-*` utility: `desk.css` comes
      // last in the cascade and both are one class of specificity, so a utility
      // trying to shrink a `.cm-tab` writes nothing, silently. `GroupNav` carried
      // a dead `lg:min-h-9` for weeks on exactly that.
      // **`TAB` carries no size and never has** — its own docblock says "size and
      // padding stay the caller's", and every other caller supplies one. This did
      // not, so four labels rendered at the browser's 16px default under a thumb
      // and DROPPED to 14 above `lg` via `TAB`'s own `lg:text-sm`: a step past the
      // ladder's ceiling, with the phone/desk relation inverted. Caught by
      // `register-warden` on 11 Sep 2026.
      //
      // `text-2xs` is `TabStrip`'s `phrase` step, which is the one these are:
      // four one-word plates with room, not five squeezed onto a line.
      className={`${TAB} px-3 text-2xs${quiet ? " cm-tab-quiet" : ""}`}
    >
      {LABEL[value]}
    </button>
  );
}
