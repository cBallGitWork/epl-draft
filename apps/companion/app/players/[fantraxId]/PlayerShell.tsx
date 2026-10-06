import type { ReactNode } from "react";
import { clubColoursOf } from "@epl/core";
import PlateShell from "../../components/shell/PlateShell";
import { POOL } from "../routes";
import PlayerTabs from "./PlayerTabs";
import type { PlayerTab } from "./PlayerTabs";
import type { Subject } from "./subject";

// The frame every player screen wears: CM's plated bar in his club's colours (`cm9900/11.jpg`), grey for a man FPL
// has never listed, over his four tabs.

export default function PlayerShell({
  subject,
  fantraxId,
  current,
  children,
}: {
  /** Who the screen is about, whole, so the four views read him one way. */
  subject: Subject;
  fantraxId: string;
  current: PlayerTab;
  children: ReactNode;
}) {
  const { intel, football, ownerName } = subject;
  const club = football?.club;
  return (
    <PlateShell
      colours={clubColoursOf(club)}
      title={heading(intel.name || fantraxId, ownerName)}
      back={POOL}
      tabs={<PlayerTabs fantraxId={fantraxId} current={current} empty={hollow(subject)} />}
    >
      {children}
    </PlateShell>
  );
}

/** `Bruno Fernandes (Raccoons)`: the fantasy side in CM's brackets, no shirt number (Craig, 4 Sep 2026); a free
 *  agent has no brackets. */
function heading(name: string, ownerName: string | null): string {
  return ownerName === null ? name : `${name} (${ownerName})`;
}

/** The views with nothing behind them for this man, decided from him rather than from the tab you
 *  are on: a man the bridge has never settled has no Premier League record, which is all of Data. */
function hollow({ football }: Subject): readonly PlayerTab[] {
  return football === null ? ["data"] : [];
}
