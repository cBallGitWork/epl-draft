import type { Club, FootballPlayer, IntelStarter } from "@epl/core";
import PitchMarker from "../../../components/league/PitchMarker";
import PitchRows from "../../../components/league/PitchRows";
import { DASH } from "@epl/core";

// A club's predicted eleven, on the same grass the fantasy eleven stands on.
//
// **Literally the same components** (Craig, 3 Sep 2026: "make it the same as the
// fantasy squad page — this is what i meant by sharing the same pitch"). An
// earlier cut built its own cut-out cards on the photographed trapezoid, the
// tab's photographed pitch, and it looked nothing like the rest of the app.
// `CmGround` + `PitchRows` + `PitchMarker` is what `squad/[teamId]/Sheet` draws,
// and it stopped taking a roster slot on 3 Sep so that a Premier League
// eleven could use it without a Fantrax id going anywhere near a football page.
//
// **The keeper stands at the TOP** (Craig, 10 Sep 2026), which is this site's
// arrangement as of that date and the reverse of the one this paragraph used to
// record. `predictedEleven` hands the rows over goal-first and `PitchRows` draws
// them in the order it is given, so they are passed straight through — reversing
// them here would put the forward on the goal line, which is what it did once.
//
// **Eleven of the same kit, told apart by the NAME** (Craig, 10 Sep 2026: "ditch
// the number actually"). A number rode on the chest here for one afternoon, on
// the reading that eleven identical shirts need one; the plate under each shirt
// carries the name at full width instead, which is the thing a reader was going
// to read anyway.

export interface ElevenLine {
  line: string;
  players: IntelStarter[];
}

export default function Eleven({
  lines,
  against,
  updated,
  club,
  playerOf,
  positionOf,
}: {
  lines: ElevenLine[];
  /** What the eleven is FOR — "v Chelsea · Sun 6 Sep". Null when FPL has
   *  published no next match, and then the caption says only what it is. */
  against: string | null;
  /** When Scout last updated the eleven — "Fri 4 Sept, 17:52". */
  updated: string | null;
  club: Club;
  /** The footballer behind a code, or null when the snapshot has not got him. */
  playerOf: (code: number) => FootballPlayer | null;
  /** What OUR league would field him as — `MID`, `M/F`. Null when Fantrax has
   *  no opinion, or would not answer. */
  positionOf: (code: number) => string | null;
}) {
  // **The first line IS the keeper's**, by construction: `predictedEleven` builds
  // `[{line: "GK", players: [keeper]}, …]` off the shape, so this is the one
  // ordering fact the arrangement asserts. Read here rather than inside the cell
  // because `PitchRows` hands its children a player and not the line he stands
  // in — which is right, and is why `Formation` reads its own the same way.
  const keeper = lines[0]?.players[0]?.code ?? null;

  return (
    <div className="flex flex-col gap-1">
      {/* **What the eleven is and who it is against** (Craig, 3 Sep 2026: "real
          team needs Predicted XI versus next opponent whoever that is, use
          dates"). A pitch with no heading is eleven faces on grass; the reader
          has to be told this is a PREDICTION and which match it is for, or it
          reads as a team sheet. One line (Craig, 23 Sep 2026: "We don't need
          three rows"), with when Scout last updated it in brackets. */}
      <p className="cm-title text-center font-chrome text-2xs font-bold text-accent lg:text-sm">
        Predicted XI{against === null ? "" : ` ${against}`}
        {updated === null ? "" : ` (last updated ${updated})`}
      </p>
      {/* **`PitchRows` draws its own ground.** Wrapping this in a `CmGround` of
          its own put one pitch inside the other and drew the furniture of the
          wrong one over the right one (Craig, 3 Sep 2026: "still showing the fpl
          pitch on top of the designed pitch"). There is one ground to pick from
          now. `TeamSheet` passes the flags and nothing
          else, so this does too.
          `inColumn` because it stands beside the squad list: bleeding is right
          for a pitch that is the widest thing on the screen, and full-bleed made
          this one 1,132px wide and 1,192 tall — 556px past the fold at 1440. */}
      <PitchRows
        rows={lines.map((row) => ({ label: row.line, players: row.players }))}
        keyOf={(starter) => String(starter.code)}
        inColumn
      >
        {(starter) => {
            const player = playerOf(starter.code);
            return (
              <PitchMarker
                player={player}
                // Only reached for a man with no CLUB either, which cannot
                // happen here — this whole pitch is one club. A man the
                // prediction names and the bootstrap does not still gets his
                // club's kit, because a kit is chosen by club code.
                label="?"
                // **FPL's own short name**, which is what `web_name` is for: a
                // 110px card needs "Gabriel", not "Gabriel dos Santos
                // Magalhães". The fantasy pitch abbreviates instead
                // (`pitchName`) because a Fantrax roster line has no short form
                // to reach for — the same problem answered by the better
                // source rather than the same rule applied twice.
                name={player?.name ?? DASH}
                // Hardcoded `false` until 10 Sep 2026, which drew twenty keepers
                // in outfield shirts — invisible while the kit was a fallback
                // that fired for one man in eight, and the first thing you see
                // now that it is the whole pitch.
                keeper={starter.code === keeper}
                club={club}
                // **His Fantrax position** (Craig, 3 Sep 2026: "prediction just
                // needs the name and their fantrax position"). A probability
                // rode here first and answered the wrong question: a reader
                // looking at a predicted eleven is a fantasy manager, and what
                // he wants to know about a man about to start is what our
                // league would field him as.
                band={positionOf(starter.code) ?? DASH}
              />
            );
          }}
      </PitchRows>
    </div>
  );
}
