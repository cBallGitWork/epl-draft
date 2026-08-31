import type { ReactNode } from "react";
import ViewToggle, { type View } from "./ViewToggle";

// The strip above a board: how to show it, and whatever there is to say about it.
//
// Three boards draw the same fifteen or eleven and every one of them had grown
// its own copy of this row — the squad board, a rival's sheet, and the
// head-to-head. Two put the toggle at the LEFT and the third at the right, so
// the one control a manager uses on all three screens moved across the page
// depending on which he was on. That is what this file is for; the row itself is
// three classes.
//
// **The toggle is on the left and the aside opposite it.** One decision, in one
// place, rather than three that agreed twice.
//
// The aside stays the caller's, styled and all. It is a player count on one
// screen, a formation and a count on another, and a round word on the third —
// a caption here and part of a sub-heading there — which is the same reason
// `RoundWord` is style-neutral. What must not vary is where it sits.
//
// The state stays the caller's too. Each board owns which arrangement it is
// showing, because each board is what draws the two arrangements.

export default function BoardBar({
  view,
  onPick,
  children,
}: {
  view: View;
  onPick: (view: View) => void;
  /** Whatever the board has to say beside the control. Absent is ordinary and
   *  needs no placeholder: with the toggle at the left, nothing to say is
   *  nothing drawn. */
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <ViewToggle view={view} onPick={onPick} />
      {children}
    </div>
  );
}
