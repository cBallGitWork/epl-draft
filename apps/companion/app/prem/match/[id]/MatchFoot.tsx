import Link from "next/link";
import type { Club } from "@epl/core";
import { CLUB } from "../../PremNav";

// Championship Manager's SECOND foot row, finally drawn.
//
// `docs/ui/reference/README.md` lists it as one of the two things every screen
// in the library has and ours had on none: a strip of related screens under the
// panel — `Newcastle Stats · Player Ratings · Chelsea Stats` on the match
// overview, `Milan Stats · Player Ratings · Latest Scores · League Table ·
// Fiorentina Stats` in `cm0102/02.jpg`. `PremNav` recorded the section waiting
// for its second entry rather than shipping one stray button; a match is the
// screen that has three.
//
// It replaces the grey `ButtonLink` row this page shipped with (Craig, 4 Sep
// 2026: *"remove the grey row (both teams and back to results)"*). The way back
// to the round list goes with it — the rail is one tap away at every width, and
// the browser has its own gesture.
//
// **`.cm-foot`, and this file is why the class exists.** It IS the object CM
// draws across the bottom of a screen, and so is the phone's section nav; both
// wore `cm-tab`, which is the strip UNDER a title bar. The foot row is flat with
// one light edge along the top and a rule between plates — see `desk.css`.
//
// **It carried a third, dead plate until 10 Sep 2026, and it was right to.** The
// middle one read `Match Stats` and went nowhere — the placeholder for the
// advanced data (Craig, 4 Sep: *"Add a placeholder button for section where
// advanced data goes"*), on the argument that a plate saying what it is waiting
// for is the honest version of a tab we cannot fill.
//
// It is gone because the wait is over: possession, shots, corners and the rest
// are a real tab now, off `/stats/match`. A foot plate and a tab to one place is
// the screen repeating itself, so the placeholder retires rather than becoming a
// link. Action Zones is the one thing still unsourced and it gets no plate here
// either — `MatchTabs` carries that ruling.

export default function MatchFoot({
  home,
  away,
}: {
  home: Club | undefined;
  away: Club | undefined;
}) {
  return (
    <nav aria-label="Related screens" className="cm-foot flex">
      <Plate club={home} />
      <Plate club={away} />
    </nav>
  );
}

/** One club's way out. Absent rather than dead when the snapshot does not carry
 *  the club — a plate reading "—" is a button with nothing behind it. */
function Plate({ club }: { club: Club | undefined }) {
  if (club === undefined) return null;
  return (
    <Link
      href={`${CLUB}/${club.code}`}
      className="flex flex-1 items-center justify-center px-2 text-center text-xs font-medium lg:text-sm"
    >
      {club.shortName} Stats
    </Link>
  );
}
