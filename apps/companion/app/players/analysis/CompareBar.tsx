import type { CSSProperties } from "react";
import type { Club } from "@epl/core";
import { clubColoursOf, inkOn } from "@epl/core";
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

export default function CompareBar({ a, b }: { a: Side; b: Side | null }) {
  // **One man is a whole bar, not half of one** (Craig, 10 Sep 2026: *"give me
  // the option to look at 1 player only"*). He takes the full width and there is
  // no `v`, because a `v` with nothing on the other side of it is a comparison
  // the screen is not making.
  if (b === null) {
    return (
      <header className="flex items-stretch">
        <Half side={a} />
      </header>
    );
  }

  return (
    <header className="flex items-stretch">
      <Half side={a} />
      <span className="cm-bevel numeric flex min-h-20 w-8 shrink-0 items-center justify-center text-lg font-bold uppercase lg:min-h-28 lg:w-12 lg:text-3xl">
        v
      </span>
      <Half side={b} />
    </header>
  );
}

/** Not exported: the page passes a literal, which structural typing checks. */
interface Side {
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
  const colours = clubColoursOf(side.club);
  const ink = inkOn(colours);

  return (
    // **A bigger face here than anywhere else** (Craig, 10 Sep 2026: *"can make
    // portraits bigger on this screen if we want"*). `--row-portrait` is what
    // sizes the disc — `desk.css` shrinks it with the row that carries it and
    // `PitchMarker` raises it for a marker on the grass — so the bar raises it
    // rather than the component growing a size of its own. `large` comes with
    // it: at 64px the 110x140 source is visibly soft, which is the trap
    // `PlayerPortrait`'s own ceiling docblock names.
    <div
      className="flex min-h-20 min-w-0 flex-1 items-center gap-2.5 px-2.5 lg:min-h-28"
      style={{ background: colours.primary, "--row-portrait": "3.5rem" } as CSSProperties}
    >
      <PlayerPortrait player={{ code: side.code, name: side.name }} colours={colours} chrome large />
      <span
        className="cm-title min-w-0 flex-1 truncate font-chrome text-sm font-bold uppercase lg:text-2xl"
        style={{ color: ink }}
      >
        {side.name}
      </span>
    </div>
  );
}
