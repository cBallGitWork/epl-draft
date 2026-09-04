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
// **The middle plate goes nowhere on purpose.** It is the placeholder for the
// advanced data (Craig: *"Add a placeholder button for section where advanced
// data goes"*) — possession, shots, corners and the action zones, which arrive
// with the sister repo's export. A plate that says what it is waiting for is the
// honest version of a tab we cannot fill; a plate linking to an empty screen is
// not. Not a `<Link>`, and not `TabStrip`'s `dim` either: that greys a view with
// nothing behind it FOR THIS SUBJECT, and this one has nothing behind it for any
// match ever played.

export default function MatchFoot({
  home,
  away,
}: {
  home: Club | undefined;
  away: Club | undefined;
}) {
  return (
    <nav aria-label="Related screens" className="flex">
      <Plate club={home} />
      <span
        aria-disabled="true"
        className="cm-tab cm-out flex flex-1 items-center justify-center px-2 text-center text-3xs font-bold uppercase lg:text-sm"
      >
        Match Stats
      </span>
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
      className="cm-tab flex flex-1 items-center justify-center px-2 text-center text-3xs font-bold uppercase lg:text-sm"
    >
      {club.shortName} Stats
    </Link>
  );
}
