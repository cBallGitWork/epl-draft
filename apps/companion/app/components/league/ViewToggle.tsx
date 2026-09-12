"use client";

import { TAB } from "@/app/desk";

// Which view of a squad you are looking at.
//
// **Two screens, not three, and not the squad board.** It served three until 31
// Aug, when the gated squad board lost its pitch and had nothing left to switch
// between — fifteen men with no arrangement is not a shape (DESIGN §9). What is
// left is the head-to-head board and a locked squad, the two screens that still
// draw an eleven two ways.
//
// **It is a TAB STRIP now, and on the head-to-head that is the point** (Craig,
// 11 Sep 2026: *"and need the blue bars"*). The match screen carries no
// `LeagueShell`, so it had no blue anywhere — the two grey plates were the only
// navigation on it, and by 11 Sep they were choosing between four views rather
// than two. DESIGN §2 names the object: a tab strip picks one of a SUBJECT'S
// views, which is exactly what this does, and `.cm-tab` is the plate for it.
//
// **Full height on the match screen and QUIET everywhere else**, which is the
// distinction `.cm-tab-quiet` was written for (Craig, 10 Sep 2026, on the pool's
// stat groups: *"these have blue bars, but we already have blue bars on this
// page, do we need them this big?"*). The head-to-head carries no other strip, so
// this IS its strip; the squad and club screens already have a five-plate one
// above, and a second at the same height is two blue bars of one size with
// neither ranked. Measured the day it shipped: the squad page drew both at 56.
//
// `aria-current="page"` rather than `aria-pressed`, because `.cm-tab`'s yellow
// label-and-border is keyed off it in `desk.css` and a strip that had to be
// styled twice would be two strips.

export type View = "pitch" | "list" | "lineups" | "stats" | "players" | "table" | "scores";

/** What each view is called on its plate.
 *
 *  Here rather than at the call sites: three screens draw this strip and a label
 *  spelled differently on one of them is a different control.
 *
 *  **One word each, and on the head-to-head that is a MEASUREMENT rather than a
 *  preference.** That strip carries five plates now, which leaves about 73px
 *  apiece at 390 — room for ten characters at `2xs` and no more. Craig named two
 *  of them "Match Up stats" and "Player stats"; neither fits, and the fix is a
 *  shorter word rather than a smaller one, because this file has already been
 *  caught once dropping off the type ladder (see `TAB` below). `Stats` is the
 *  categories and `Players` is the men, which is the distinction the two boards
 *  make anyway. */
const LABEL: Record<View, string> = {
  pitch: "Pitch",
  list: "List",
  lineups: "Lineups",
  stats: "Stats",
  players: "Players",
  table: "Table",
  scores: "Scores",
};

/** The pair every screen but the head-to-head draws. A frozen literal rather than
 *  an inline default, so the two callers that take it share one array instead of
 *  allocating one each render. */
const BOTH: readonly View[] = ["pitch", "list"];

export default function ViewToggle({
  view,
  onPick,
  views = BOTH,
  quiet = false,
}: {
  view: View;
  onPick: (view: View) => void;
  /** Whether this is a SECOND strip on a screen that already has one. Drops the
   *  plate to the control floor, which is what `.cm-tab-quiet` means. */
  quiet?: boolean;
  /** Which plates to draw, in the order they are drawn. Defaults to the pitch
   *  and the list, which is every caller but the match screen. */
  views?: readonly View[];
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
      {views.map((value) => (
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
