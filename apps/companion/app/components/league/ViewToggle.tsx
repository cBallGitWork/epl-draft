"use client";

// Pitch or list, for the same fifteen men.
//
// Three screens ask it now — the squad board, the head-to-head board, and the
// squad page once a period has opened — which is the rule of 3 firing. The two
// copies that already existed had drifted apart in type and shape: one control
// read `Pitch List` in small capitals with a border, the other `PITCH LIST` in
// letterspaced 2xs with none, and they sit two taps from each other.
//
// The squad board's spelling wins, because `/squad/[teamId]` is the declared
// reference for the visual direction. That does change how the control looks on
// the head-to-head board — the one visible consequence of this extraction, and
// stated rather than buried, because a refactor that quietly restyles a screen
// is the thing CODE_RULES is guarding against.
//
// `min-h-9` rather than `min-h-11` is the app's one deliberate touch-target
// exception, and it is documented in docs/ui/squad.md. It stays an exception
// here rather than becoming a precedent: this control sits directly above the
// thing it switches, so a mis-tap costs a glance and nothing else.

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
      // box-with-a-gap around them was a modern segmented control.
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
      className={`min-h-9 px-3.5 text-xs font-semibold capitalize ${
        here ? "cm-bevel-pressed" : "cm-bevel hover:brightness-110"
      }`}
    >
      {value}
    </button>
  );
}
