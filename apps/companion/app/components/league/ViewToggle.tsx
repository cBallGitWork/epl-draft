"use client";

// Pitch or list, for the same eleven.
//
// **Two screens, not three, and not the squad board.** It served three until 31
// Aug, when the gated squad board lost its pitch and had nothing left to switch
// between — fifteen men with no arrangement is not a shape (DESIGN §9). What is
// left is the head-to-head board and a locked squad, the two screens that still
// draw an eleven two ways. This docblock said "the squad board's spelling wins"
// for four hours after the squad board stopped calling it, and six documents
// were citing that sentence back.
//
// `min-h-9` rather than `min-h-11` is the app's one deliberate touch-target
// exception, recorded in PRODUCT.md and measured by `tools/ui/tapfit.mjs`, which
// finds it structurally — whatever sits inside this `role="group"`. It stays an
// exception rather than becoming a precedent: the control sits directly above
// the thing it switches, so a mis-tap costs a glance and nothing else.

export type View = "pitch" | "list";

export default function ViewToggle({
  view,
  onPick,
}: {
  view: View;
  onPick: (view: View) => void;
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
      className="flex"
    >
      <ViewButton current={view} value="pitch" onPick={onPick} />
      <ViewButton current={view} value="list" onPick={onPick} />
    </div>
  );
}

function ViewButton({
  current,
  value,
  onPick,
}: {
  current: View;
  value: View;
  onPick: (view: View) => void;
}) {
  const here = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={here}
      // Pressed rather than filled. The affordance and the state are one
      // object, which is how the game said it and how `league/Columns` already
      // draws a sorted column head — and it keeps the two plates the same
      // colour, so the strip cannot shift as you move along it. `aria-pressed`
      // carries the state for a reader who cannot see a bevel.
      // `min-h-9` and not `min-h-11`: PRODUCT.md's recorded tap exception for a
      // control that is one of a pair filling the row, where the target is the
      // whole half of the bar rather than a plate you have to find.
      className={`min-h-9 flex-1 px-3.5 text-xs font-semibold capitalize ${
        here ? "cm-bevel-pressed" : "cm-bevel hover:brightness-110"
      }`}
    >
      {value}
    </button>
  );
}
