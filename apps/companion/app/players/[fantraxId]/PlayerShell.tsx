import type { ReactNode } from "react";
import { clubColours } from "@epl/core";
import PlateShell from "../../components/shell/PlateShell";
import PlayerTabs from "./PlayerTabs";
import type { PlayerTab } from "./PlayerTabs";
import { bornLine } from "./bio";
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
  // The clock lives here rather than in each of the four routes. It is the one
  // thing on the screen that changes without the data changing, and a server
  // component is an edge — `bio.ts` stays pure and takes it as an argument.
  // **The bio line gets its own box, in neither the accent nor the bare ground.**
  //
  // It sat in the yellow caption for one commit, on the argument that CM gives
  // that box to the man — and CM does. But CM's yellow is not our accent, whose
  // one meaning is *yours · selected · active · primary* (DESIGN §3), and a birth
  // date is none of those; §3 has already refused this exact trade once, over the
  // playoff cut line. The caption keeps the view name, which IS the active thing.
  //
  // It then went to `PageHeader`'s `sub` — under the bar, where CM puts it, and
  // in tabular figures. `groundfit` reported that as text on the bare ground the
  // moment the instrument was repaired, because `sub` sits on no plate. So it
  // gets a panel of its own, which is what a CM screen is made of anyway.
  // **Where he is from goes in CM's own line** (Craig, 4 Sep 2026: *"put theire
  // nationality in Born 8.9.94 (Age 31). row"*), which is what the reference does
  // — `Born 2.10.79 (Age 19). English.` — and it is why the Player block of
  // birthplace, height and weight is gone from the profile. One fact, one place.
  const born = bornLine(
    football?.player.birthDate ?? null,
    new Date(),
    labelled(intel.personal, "Birthplace"),
  );
  return (
    // `clubColours` answers its own grey fallback for an empty short name, which
    // is what the 88 unbridged men in the pool get.
    <PlateShell
      colours={clubColours(club?.shortName ?? "")}
      title={heading(intel.name || fantraxId, ownerName)}
      tabs={<PlayerTabs fantraxId={fantraxId} current={current} empty={hollow(subject)} />}
    >
      {/* CM's caption box, in CM's position, carrying what CM carries — the man,
          not the view. Not in the accent: `PlateShell`'s `caption` docblock says
          why a birth date cannot have that slot, and why this screen passes no
          caption at all rather than spending it on the word "Profile". */}
      {born === null ? null : (
        <p className="cm-panel cm-title px-2 py-1 text-center font-chrome text-sm font-bold text-ink lg:text-lg">
          {born}
        </p>
      )}
      {children}
    </PlateShell>
  );
}

/** One labelled row's value out of a Fantrax block, or null.
 *
 *  Fantrax pads these blocks with empty rows — `profile.ts` records it — so a
 *  present label with an empty value is as absent as a missing one. */
function labelled(rows: readonly { label: string; value: string }[], label: string): string | null {
  return rows.find((row) => row.label === label)?.value?.trim() || null;
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

/** The views that have nothing behind them for this man.
 *
 *  **Decided from the SUBJECT, not from the page you are on.** Each of the four
 *  routes used to pass its own answer, so an unbridged player had the tab he was
 *  standing on greyed and the genuinely empty ones left bright — the strip
 *  disagreed with itself depending on where you had tapped from.
 *
 *  Only History. A man the bridge has never settled has no Premier League record
 *  at all, which is the whole of that tab; Profile still carries what Fantrax
 *  knows about him and Fitness still carries their news line, so neither is
 *  empty even though both lose their football half. Transfer never depends on
 *  the bridge. */
function hollow({ football }: Subject): readonly PlayerTab[] {
  return football === null ? ["data", "history"] : [];
}
