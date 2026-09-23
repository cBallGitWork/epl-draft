import type { CSSProperties, ReactNode } from "react";
import type { ClubColours } from "@epl/core";
import { plateOn } from "@epl/core";
import Caption from "./Caption";
import PageHeader from "./PageHeader";

// The frame a screen about a SUBJECT wears: his own colour on the bar, his tabs
// under it, the yellow caption under those, and every table inside drawn in his
// colours rather than the division's.
//
// **Extracted at the third plated subject, which is where the second one said it
// would be.** `prem/club/[code]/Shell.tsx` declined the abstraction in writing:
// *"Two spines are a coincidence (CODE_RULES §1), and a `PlateShell` today would
// take two parameters, the nav and the colour source, so that a second caller
// could exist. **The trigger is the third plated subject**: a player profile or a
// manager drawn on his own colour. At that point the three callers say what
// actually varies."* A player profile arrived. Counted: three (a fantasy team, a
// club, a player).
//
// **What the three callers said varies** — and it is not what that note guessed:
//
//   · the COLOUR SOURCE (`teamColours` for a manager, `clubColours` for the
//     other two), which is why this takes the colours already resolved rather
//     than an id and a lookup;
//   · the TITLE, which is a name for two of them and a construction for the
//     third (`5. Harry Maguire (MUN)`);
//   · the TAB STRIP, which is a different component per subject.
//
// The strip is passed as a NODE rather than as a list of tabs and a base href. A
// config object would make this a nav framework three callers configure, which
// is CODE_RULES §1's generic mechanism — and each caller's tab file is where its
// own docblock lives, saying which tabs and why one is missing.
//
// **What does NOT vary is the whole point**: `plateOn` picking the ink that
// survives the fill, the `--cm-index` re-point, and `gap-2` between the boxes.
// Those were three copies of a decision, and a pale club being unreadable is the
// failure they were each guarding against separately (`cm9900/16.jpg`'s white
// Torquay).

export default function PlateShell({
  colours,
  title,
  sub,
  caption,
  tabs,
  children,
}: {
  /** Already resolved, because the three subjects resolve them from different
   *  tables — a manager's from `teamColours`, a club's and a player's from
   *  `clubColours`. Taking an id here would mean taking a discriminator too. */
  colours: ClubColours;
  /** What goes on the bar. CM's title bars carry a title and nothing else. */
  title: string;
  /** The line UNDER the bar, never inside it. One caller uses it. */
  sub?: ReactNode;
  /** CM's yellow box: the bar above names the screen, this names what is in the
   *  panel, and every screen in the reference library carries both.
   *
   *  **Optional, and the third caller is why.** A club and a fantasy team have
   *  nothing to put here but the view name, and the accent is right for it —
   *  yellow means *active* and the view you are on is the active thing. A PLAYER
   *  has something better: CM gives that box to the man (`Born 2.10.79 (Age 19).
   *  English.`). But a birth date is not *yours · selected · active · primary*,
   *  so it cannot take the accent — and with the tab strip already marking the
   *  current view in accent two rows above, a caption reading "Profile" is the
   *  slot spent twice on one fact. So that caller draws its own box instead and
   *  passes nothing. */
  caption?: string;
  tabs: ReactNode;
  children: ReactNode;
}) {
  const plate = plateOn(colours);

  return (
    // `gap-2` because four boxes down the page need 12px between them or they
    // read as one object.
    //
    // **The subject's colour, set once for all his tabs.** `--cm-index`
    // re-points the block every CM table runs down its left — the ranks on a
    // stats board, the rounds on a fixture list — so a manager's screens are his
    // rather than the league's deep blue (Craig, 2 Sep). Scoped here rather than
    // passed to each table: it is a property of whose screen this is, and every
    // table inside inherits it without knowing.
    // `cm-index-scoped`: the block's ground is this subject's colour rather than
    // the app's deep blue, so its gradient runs away from its ink and it must not grey — see
    // `desk.css`. Without it a greyed bench row read 3.89:1 on a purple chip.
    <div
      className="cm-index-scoped flex flex-col gap-2"
      style={
        {
          "--cm-index": plate.background,
          "--cm-index-ink": plate.ink,
        } as CSSProperties
      }
    >
      <PageHeader title={title} sub={sub} plate={plate} />
      {tabs}
      {/* The caption's own box, not a heading inside the content's (Craig,
          1 Sep). Absent for a subject that draws a better box of its own. */}
      {caption === undefined ? null : <Caption>{caption}</Caption>}
      {children}
    </div>
  );
}
