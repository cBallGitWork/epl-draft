import Link from "next/link";
import type { DepthSpot, FootballPlayer } from "@epl/core";
import CmGround from "../../../../components/league/CmGround";
import { doubtRow } from "../../../../components/football/doubtRow";
import { PLAYER } from "../../../routes";

// The depth chart on CM's pitch (Craig, 25 Sep 2026: "pitch view, CM graphics, no thumbnails or
// shirts"): each place a plate with its shirt on top and the men in line under it, first choice
// loudest, and a doubt's name washed in the doubt ramp.

export default function DepthPitch({
  lines,
  playerOf,
}: {
  lines: readonly (readonly DepthSpot[])[];
  playerOf: (code: number) => FootballPlayer | null;
}) {
  return (
    <CmGround inColumn>
      {lines.map((line, row) => (
        <div key={row} className="flex justify-center gap-1 lg:gap-2">
          {line.map((spot, at) => (
            <Plate key={`${spot.slot}-${at}`} spot={spot} playerOf={playerOf} />
          ))}
        </div>
      ))}
    </CmGround>
  );
}

/** One place on the pitch: the shirt in the club's index block, then the men in line for it. */
function Plate({ spot, playerOf }: { spot: DepthSpot; playerOf: (code: number) => FootballPlayer | null }) {
  const men = spot.holders.flatMap((holder) => {
    const player = playerOf(holder.code);
    return player === null ? [] : [player];
  });
  return (
    <div className="flex w-0 min-w-0 max-w-32 flex-1 flex-col overflow-hidden border border-bg bg-surface/90 shadow-[0_2px_4px_oklch(0_0_0/0.45)]">
      <span className="cm-index flex h-5 items-center justify-center text-3xs" title={spot.label}>
        {spot.slot}
      </span>
      {men.length === 0 ? (
        <span className="px-1 py-0.5 text-center text-2xs text-faint">—</span>
      ) : (
        men.map((player, rank) => (
          <Link
            key={player.code}
            href={`${PLAYER}/${player.code}`}
            className={`truncate border-t border-bg px-1 py-0.5 text-center font-chrome hover:underline lg:text-xs ${
              rank === 0 ? "text-2xs font-bold text-ink" : "text-2xs text-muted"
            } ${doubtRow(player)}`}
          >
            {player.name}
          </Link>
        ))
      )}
    </div>
  );
}
