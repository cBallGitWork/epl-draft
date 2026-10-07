import type { Club, FootballPlayer, IntelStarter } from "@epl/core";
import PitchMarker from "../../../components/league/PitchMarker";
import PitchRows from "../../../components/league/PitchRows";
import { DASH } from "@epl/core";

// A club's predicted eleven on the fantasy pitch's own components (Craig, 3 Sep 2026).
// Rows arrive goal-first and pass straight through, keeper at the top (Craig, 10 Sep 2026).
// The one pitch that draws faces (Craig, 26 Sep 2026); a man with no photograph gets his club's kit.

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
  // `predictedEleven` puts the keeper's line first; `PitchRows` hands cells a player, not his line.
  const keeper = lines[0]?.players[0]?.code ?? null;

  return (
    <div className="flex flex-col gap-1">
      {/* Without "Predicted" and the match it is for, the pitch reads as a team sheet (Craig, 3 Sep 2026). */}
      <p className="cm-title text-center font-chrome text-2xs font-bold text-accent lg:text-sm">
        Predicted XI{against === null ? "" : ` ${against}`}
        {updated === null ? "" : ` (last updated ${updated})`}
      </p>
      {/* `PitchRows` draws its own ground: a `CmGround` around it nests two pitches.
          `inColumn` because it stands beside the squad list; full bleed runs it past the fold. */}
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
                // Only for a man with no club, which one club's pitch cannot have.
                label="?"
                // FPL's short name: a 110px card needs "Gabriel", not "Gabriel dos Santos Magalhães".
                name={player?.name ?? DASH}
                keeper={starter.code === keeper}
                club={club}
                // His Fantrax position, not a probability (Craig, 3 Sep 2026).
                band={positionOf(starter.code) ?? DASH}
                face={player ?? undefined}
              />
            );
          }}
      </PitchRows>
    </div>
  );
}
