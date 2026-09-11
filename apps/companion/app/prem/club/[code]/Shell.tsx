import type { ReactNode } from "react";
import type { Club } from "@epl/core";
import { clubColours } from "@epl/core";
import PhotoGround from "../../../components/football/PhotoGround";
import PlateShell from "../../../components/shell/PlateShell";
import ClubTabs from "./ClubTabs";
import type { ClubTab } from "./ClubTabs";

// The frame every club screen wears.
//
// **A club bar, not a competition bar.** CM draws two and which one you get says
// what KIND of thing the screen is about: `cm9900/24.jpg` is the division — a
// light plate with the title in blue — and `25.jpg` is Everton, a filled plate
// carrying the name. A club is somebody IN the competition rather than the
// competition, so it takes the second, in that club's own colours.
//
// This file used to hold the bar, the caption and the `--cm-index` re-point, and
// a note declining to share them until a third plated subject appeared. One did
// — a player profile — so they are `PlateShell`'s now. What is left is the two
// things that are this subject's own: the colour table a club is looked up in,
// and its tabs.

export default function ClubShell({
  club,
  title,
  current,
  empty,
  children,
}: {
  club: Club;
  /** What this VIEW is — "Squad", "Fixtures". */
  title: string;
  current: ClubTab;
  empty?: readonly ClubTab[];
  children: ReactNode;
}) {
  return (
    <PlateShell colours={clubColours(club.shortName)} title={club.name} caption={title}
      tabs={<ClubTabs code={club.code} current={current} empty={empty} />}>
      {/* **This club's own ground, behind this club's own screen.** The shell's
          standing photograph stands down here (`drawsOwnGround`) because it
          renders above every route and cannot know whose screen this is; the one
          place that does know is this Shell. A club we have no photograph for
          falls back to the desk's, which is `PhotoGround`'s own decision. */}
      <PhotoGround subject={club.shortName} />
      {children}
    </PlateShell>
  );
}
