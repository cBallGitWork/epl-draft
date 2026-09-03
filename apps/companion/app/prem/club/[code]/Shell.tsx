import type { CSSProperties, ReactNode } from "react";
import type { Club } from "@epl/core";
import { clubColours, plateOn } from "@epl/core";
import Caption from "../../../components/shell/Caption";
import PageHeader from "../../../components/shell/PageHeader";
import ClubTabs from "./ClubTabs";
import type { ClubTab } from "./ClubTabs";

// The frame every club screen wears.
//
// **A club bar, not a competition bar.** CM draws two and which one you get says
// what KIND of thing the screen is about: `cm9900/24.jpg` is the division — a
// light plate with the title in blue — and `25.jpg` is Everton, a filled plate
// carrying the name. A club is somebody IN the competition rather than the
// competition, so it takes the second, in that club's own colours. `plateOn`
// computes the pair — the fill and whichever ink survives it — because a
// background without its ink is the half of the decision that makes a pale club
// unreadable. `cm9900/16.jpg`'s white Torquay is the case, and not one we
// invented.
//
// **A copy of `squad/[teamId]/Shell`, deliberately.** Subtract `PageHeader`'s
// plate variant, `TabStrip`, `Caption` and `TabEmpty` — all four already shared
// — and what is left is a colour lookup and four lines of composition. Two
// spines are a coincidence (CODE_RULES §1), and a `PlateShell` today would take
// two parameters, the nav and the colour source, so that a second caller could
// exist. **The trigger is the third plated subject**: a player profile or a
// manager drawn on his own colour. At that point the three callers say what
// actually varies and `components/shell/PlateShell` is worth having.

export default function ClubShell({
  club,
  title,
  current,
  empty,
  children,
}: {
  club: Club;
  /** What this VIEW is — "Squad", "Fixtures". CM's yellow caption inside the
   *  panel: the bar above names the club, this names what is in the box, and
   *  every screen in the reference carries both. */
  title: string;
  current: ClubTab;
  empty?: readonly ClubTab[];
  children: ReactNode;
}) {
  const plate = plateOn(clubColours(club.shortName));

  return (
    // **The club's colour, set once for every tab.** `--cm-index` re-points the
    // block every CM table runs down its left — the gameweeks on Fixtures, the
    // position slots on the Squad — so a club's screens are its own rather than
    // the division's deep blue. Scoped here rather than passed to each table: it
    // is a property of whose screen this is, and every table inside inherits it
    // without knowing.
    <div
      className="flex flex-col gap-2"
      style={{ "--cm-index": plate.background, "--cm-index-ink": plate.ink } as CSSProperties}
    >
      <PageHeader title={club.name} plate={plate} />
      <ClubTabs code={club.code} current={current} empty={empty} />
      <Caption>{title}</Caption>
      {children}
    </div>
  );
}
