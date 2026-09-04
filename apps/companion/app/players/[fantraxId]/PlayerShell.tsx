import type { ReactNode } from "react";
import type { Club } from "@epl/core";
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
  const { intel, football } = subject;
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
  const born = bornLine(football?.player.birthDate ?? null, new Date());
  return (
    // `clubColours` answers its own grey fallback for an empty short name, which
    // is what the 88 unbridged men in the pool get.
    <PlateShell
      colours={clubColours(club?.shortName ?? "")}
      title={heading(intel.name || fantraxId, club, intel.squadNumber)}
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

/** `5. Harry Maguire (MUN)`, CM's own construction.
 *
 *  Every part of it is optional except the name. A man with no shirt number
 *  loses the prefix rather than getting a `0.`, and one the bridge has not
 *  settled loses the club rather than getting empty brackets.
 *
 *  **The club's SHORT name, where CM writes the full one.** `3. Michael Ball
 *  (Everton)` fits 800px because both halves are short; `5. Harry Maguire (Man
 *  Utd)` measures 306px into the 282 a 390 phone gives the bar, and
 *  `PageHeader` truncates — so it shipped as `5. HARRY MAGUIRE (MAN ...`, which
 *  is worse than either whole answer. The three-letter form fits at every width,
 *  and the crest and the club's own colour are both already on the portrait
 *  underneath it. */
function heading(name: string, club: Club | undefined, squadNumber: string | null): string {
  const numbered = squadNumber ? `${squadNumber}. ${name}` : name;
  return club ? `${numbered} (${club.shortName})` : numbered;
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
