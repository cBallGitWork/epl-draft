import type { ReactNode } from "react";
import type { Club } from "@epl/core";
import { clubColours } from "@epl/core";
import PhotoGround from "../../../components/football/PhotoGround";
import PlateShell from "../../../components/shell/PlateShell";
import { PREM } from "../../routes";
import ClubTabs from "./ClubTabs";
import type { ClubTab } from "./ClubTabs";

// The frame every club screen wears: CM's club bar (`cm9900/25.jpg`), a filled plate in the club's colours.

export default function ClubShell({
  club,
  current,
  empty,
  children,
}: {
  club: Club;
  current: ClubTab;
  empty?: readonly ClubTab[];
  children: ReactNode;
}) {
  return (
    <PlateShell colours={clubColours(club.shortName)} title={club.name} back={PREM}
      tabs={<ClubTabs code={club.code} current={current} empty={empty} />}>
      {/* This club's own ground: the shell's photograph stands down here (`drawsOwnGround`).
          A club with no photograph falls back to the desk's (`PhotoGround`). */}
      <PhotoGround subject={club.shortName} />
      {children}
    </PlateShell>
  );
}
