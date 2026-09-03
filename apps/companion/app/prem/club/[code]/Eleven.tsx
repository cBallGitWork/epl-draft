import type { Club, ClubColours, FootballPlayer, IntelStarter } from "@epl/core";
import { inkOn } from "@epl/core";
import PitchDisc from "../../../components/league/PitchDisc";
import PitchRows from "../../../components/league/PitchRows";

// A club's predicted eleven, on the same grass the fantasy eleven stands on.
//
// **Literally the same components** (Craig, 3 Sep 2026: "make it the same as the
// fantasy squad page — this is what i meant by sharing the same pitch"). An
// earlier cut built its own cut-out cards on `PitchFrame`, which is the FPL
// tab's photographed pitch, and it looked nothing like the rest of the app.
// `CmGround` + `PitchRows` + `PitchDisc` is what `squad/[teamId]/Sheet` draws,
// and `PitchDisc` stopped taking a roster slot on 3 Sep so that a Premier League
// eleven could use it without a Fantrax id going anywhere near a football page.
//
// **The keeper stands at the BOTTOM**, which is this site's own arrangement:
// the fantasy pitch attacks up the screen, so the goal a squad defends is the
// near one. FFScout lists its eleven keeper-first, so the rows are reversed on
// the way in rather than at the source.
//
// The formation is set above the grass because `cm9900/19.jpg` sets it there —
// "4-4-2*" in yellow over Everton's pitch. It reads `4-2-3-1` and not
// `1-4-2-3-1`: the keeper is nobody's four and no formation counts him.

export interface ElevenLine {
  line: string;
  players: IntelStarter[];
}

export default function Eleven({
  lines,
  formation,
  club,
  colours,
  playerOf,
  positionOf,
}: {
  lines: ElevenLine[];
  formation: string;
  club: Club;
  colours: ClubColours;
  /** The footballer behind a code, or null when the snapshot has not got him. */
  playerOf: (code: number) => FootballPlayer | null;
  /** What OUR league would field him as — `MID`, `M/F`. Null when Fantrax has
   *  no opinion, or would not answer. */
  positionOf: (code: number) => string | null;
}) {
  // Attacking up the screen, so the last row drawn is the one nearest the
  // reader — the keeper's.
  const rows = [...lines].reverse();

  return (
    <div className="flex flex-col gap-1">
      <p className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-base">
        {formation}
      </p>
      {/* **`PitchRows` draws its own ground** — `flat` picks CM's diagram and
          its absence picks `PitchFrame`'s photographed trapezoid, which is the
          FPL tab's. Wrapping this in a `CmGround` of its own put one pitch
          inside the other and drew the hoardings and goal of the wrong one over
          the right one (Craig, 3 Sep 2026: "still showing the fpl pitch on top
          of the designed pitch"). `TeamSheet` passes the two flags and nothing
          else, so this does too.
          `inColumn` because it stands beside the squad list: bleeding is right
          for a pitch that is the widest thing on the screen, and full-bleed made
          this one 1,132px wide and 1,192 tall — 556px past the fold at 1440. */}
      <PitchRows
        rows={rows.map((row) => ({ label: row.line, players: row.players }))}
        keyOf={(starter) => String(starter.code)}
        flat
        inColumn
      >
        {(starter) => {
            const player = playerOf(starter.code);
            return (
              <PitchDisc
                player={player}
                // A man the prediction names and the bootstrap does not — signed
                // since, or an academy name. The disc says so rather than
                // dropping him: the prediction is still an eleven.
                label="?"
                // **FPL's own short name**, which is what `web_name` is for: a
                // 46px disc needs "Gabriel", not "Gabriel dos Santos
                // Magalhães". The fantasy pitch abbreviates instead
                // (`pitchName`) because a Fantrax roster line has no short form
                // to reach for — the same problem answered by the better
                // source rather than the same rule applied twice.
                name={player?.name ?? "—"}
                keeper={false}
                club={club}
                // **His Fantrax position** (Craig, 3 Sep 2026: "prediction just
                // needs the name and their fantrax position"). A probability
                // rode here first and answered the wrong question: a reader
                // looking at a predicted eleven is a fantasy manager, and what
                // he wants to know about a man about to start is what our
                // league would field him as.
                band={positionOf(starter.code) ?? "—"}
                fill={colours.primary}
                outline={colours.secondary}
                ink={inkOn(colours)}
              />
            );
          }}
      </PitchRows>
    </div>
  );
}
