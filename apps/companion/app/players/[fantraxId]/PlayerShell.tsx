import type { ReactNode } from "react";
import { clubColoursOf } from "@epl/core";
import PlateShell from "../../components/shell/PlateShell";
import { POOL } from "../routes";
import PlayerTabs from "./PlayerTabs";
import type { PlayerTab } from "./PlayerTabs";
import type { Subject } from "./subject";

// The frame every player screen wears.
//
// **A person's bar, in his club's colours.** Championship Manager opens a player
// profile with `3. Michael Ball (Everton)` — the shirt number, the name, and the
// club in brackets — on the same filled plate it gives a club
// (`cm9900/11.jpg`). He is somebody IN the competition rather than the
// competition, which is the distinction `PageHeader`'s two treatments exist for.
//
// **The third plated subject, which is what earned `PlateShell`.**
// `prem/club/[code]/Shell.tsx` predicted this one by name: *"The trigger is the
// third plated subject: a player profile or a manager drawn on his own colour.
// At that point the three callers say what actually varies."* It was written out
// in full first and lifted in the refactor pass after, because CODE_RULES §1
// wants the third use to SAY what varies before the abstraction is drawn. What
// it said is in `PlateShell`'s own docblock, and it was not what the note
// guessed.
//
// **A player with no club colour is not a failure case.** 88 of the 694 in the
// pool have never been settled against FPL, so there is no club and no colour;
// `clubColours` answers its own grey fallback and the bar is drawn in it. That
// is the same degrading this screen already does for the portrait.

export default function PlayerShell({
  subject,
  fantraxId,
  current,
  children,
}: {
  /** Who the screen is about. Passed whole rather than as a name, a club, a
   *  number and a birth date: the four views each derived those four the same
   *  way from the same object, which is four copies of one reading. */
  subject: Subject;
  fantraxId: string;
  current: PlayerTab;
  children: ReactNode;
}) {
  const { intel, football, ownerName } = subject;
  const club = football?.club;
  return (
    // `clubColours` answers its own grey fallback for an empty short name, which
    // is what the 88 unbridged men in the pool get.
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

/** `Bruno Fernandes (test4)`, which is CM's construction with our subject in it.
 *
 *  **The FANTASY team in the brackets, not the club** (Craig, 4 Sep 2026: *"lets
 *  put the fantasy team in here rather than club team"*). CM writes `3. Michael
 *  Ball (Everton)` because in that game the club is the thing you are managing.
 *  Ours is not: the reader manages a fantasy side, the club is already on the
 *  portrait beneath in its own colours and on its crest, and whose he IS is the
 *  fact this bar was spending its brackets on twice.
 *
 *  **And no shirt number** (Craig, same): CM's prefix is a squad number in the
 *  club you manage. Ours came from the sister repo, was null for 98 of 625, and
 *  a bar that reads `8. ` on some men and not others is a bar with a hole in it.
 *
 *  A free agent loses the brackets rather than getting empty ones — the same
 *  rule the club form had. */
function heading(name: string, ownerName: string | null): string {
  return ownerName === null ? name : `${name} (${ownerName})`;
}

/** The views with nothing behind them for this man, decided from him rather than from the tab you
 *  are on: a man the bridge has never settled has no Premier League record, which is all of Data. */
function hollow({ football }: Subject): readonly PlayerTab[] {
  return football === null ? ["data"] : [];
}
