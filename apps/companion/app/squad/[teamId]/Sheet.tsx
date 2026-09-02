import type { BreakdownLine, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import TeamSheet from "../../components/league/TeamSheet";
import Pending from "../../components/league/Pending";

// A rival's eleven once his lineups have locked — with the Pitch/List control the
// page had been losing at exactly that moment.
//
// The gap was invisible before a period had ever opened, which is why it lasted:
// all week the page renders `SquadBoard`, which owns a toggle, and the branch
// underneath it renders `TeamSheet`, which deliberately does not. `TeamSheet`'s
// reasoning is sound where it was written — the head-to-head board owns one
// control for both sides, and a second inside each side would be two controls
// saying the same thing — but this route has one side and owned no control at
// all. So the squad screen answered "who exactly is in it" all week and stopped
// answering it the moment the football started.
//
// The state lives here rather than inside `TeamSheet` for the same reason it
// lives in `MatchupBoard`: whoever draws the control owns it.

export default function Sheet({
  rows,
  bench,
  lines,
  breakdown,
  shape,
  pending,
  eligibility,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  lines: SquadDetailLine[];
  breakdown: Record<string, BreakdownLine[]>;
  /** The formation, "1-3-4-3". `lineup()` has always counted it and
   *  `lineupDetail` used to drop it; naming a shape is the first thing
   *  Championship Manager does with an eleven. */
  shape: string;
  /** Points Fantrax has not credited yet — a clean sheet is settled at the final
   *  whistle and FPL has been paying it since the hour mark. Null when there are
   *  none to preview, and never a nought. */
  pending: number | null;
  /** Eligible positions by Fantrax id, for the list's position column. */
  eligibility?: Record<string, string[]>;
}) {

  return (
    <div className="flex flex-col gap-2">
      {/* The formation in yellow above the pitch, as `cm9900/19.jpg` and the
          01/02 Bayern shot both set it. */}
      <div className="flex items-baseline justify-between gap-2 px-1">
        <span className="numeric font-chrome text-sm font-bold text-accent">{shape}</span>
        <Pending points={pending} />
      </div>

      {/* **List left, pitch right** (`19.jpg`). The list carries the whole
          squad — the XI and the reserves under them — and the pitch carries the
          ELEVEN and nothing else (Craig, 2 Sep: "it's a squad page so maybe just
          the first eleven here"). That is what the game does: the Bayern shot
          lists eighteen names down the left and draws eleven on the grass, with
          the reserves greyed in the list rather than drawn as a bench.
      
          Below `lg` they stack, list first: a phone gets the names, and the
          pitch under them rather than instead of them. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <TeamSheet
          rows={rows}
          bench={bench}
          lines={lines}
          breakdown={breakdown}
          mode="list"
          eligibility={eligibility}
        />
        <TeamSheet
          rows={rows}
          // **No bench on the grass.** The eleven is the formation; a reserve
          // has no place in one, and the strip under the pitch was drawing four
          // men who are not playing at the same size as the ones who are.
          bench={[]}
          lines={lines}
          breakdown={breakdown}
          mode="pitch"
        />
      </div>
    </div>
  );
}
