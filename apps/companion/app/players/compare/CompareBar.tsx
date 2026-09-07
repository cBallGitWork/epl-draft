import type { Club } from "@epl/core";
import { clubColours, inkOn } from "@epl/core";
import PlayerPortrait from "../../components/football/PlayerPortrait";

// Two men at once, each on his own club's colour.
//
// **`MatchBar`'s shape, and it is the second occurrence rather than the third.**
// `PlateShell` holds ONE plate and its docblock pre-refuses a config object for a
// second, so a comparison cannot wear it; `prem/match/[id]/MatchBar` already
// solved "two subjects, two colours" for a fixture and this is that again with a
// name where the score was. Two is a coincidence (CODE_RULES §1), so it is
// copied rather than extracted, and the third one is what tells us what varies.
//
// **Neither half is mirrored**, which `MatchBar` records having got wrong first
// time: each side reads left to right on its own plate. The pitch below is the
// one thing on this screen that DOES mirror, because a pitch has two ends and a
// bar does not.

export default function CompareBar({ a, b }: { a: Side; b: Side }) {
  return (
    <header className="flex items-stretch">
      <Half side={a} />
      <span className="cm-bevel numeric flex min-h-16 w-8 shrink-0 items-center justify-center text-lg font-bold uppercase lg:min-h-24 lg:w-12 lg:text-3xl">
        v
      </span>
      <Half side={b} />
    </header>
  );
}

export interface Side {
  name: string;
  club: Club | undefined;
  /** FPL's season-stable code, for the face. Null for a man the bridge has never
   *  settled, who gets his club's colours and his initials. */
  code: number | null;
}

/** One man's half: his face, then his name. No crest — the plate IS his club,
 *  and `MatchBar` carries one because a fixture's subject is the clubs
 *  themselves. Here the subject is the footballer. */
function Half({ side }: { side: Side }) {
  const colours = clubColours(side.club?.shortName ?? "");
  const ink = inkOn(colours);

  return (
    <div
      className="flex min-h-16 min-w-0 flex-1 items-center gap-2 px-2 lg:min-h-24"
      style={{ background: colours.primary }}
    >
      <PlayerPortrait player={{ code: side.code, name: side.name }} colours={colours} chrome />
      <span
        className="cm-title min-w-0 flex-1 truncate font-chrome text-sm font-bold uppercase lg:text-2xl"
        style={{ color: ink }}
      >
        {side.name}
      </span>
    </div>
  );
}
