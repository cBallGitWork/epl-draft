import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import ScrollBoard from "./ScrollBoard";
import SquadRow from "./SquadRow";
import { SMALL_CAPS } from "@/app/desk";

// The squad as a list: one run of rows, each man's positions a column, since a heading cannot hold two.

export default function SquadRows({
  lines,
  projected,
  onOpen,
  eligibility,
  bare = false,
  head = true,
  reserve = false,
}: {
  lines: SquadDetailLine[];
  /** Skip the panel: the caller has drawn one round this and whatever stands beside it. */
  bare?: boolean;
  /** Whether the points are Fantrax's projection; the heading says which, because the numbers cannot. */
  projected: boolean;
  /** Absent on the head-to-head board, which has no player card to open. */
  onOpen?: (player: SquadPlayerDetail) => void;
  /** Each man's eligible positions by Fantrax id; absent, the column prints his slot.
   *  A record, not a `Map`: a `Map` crosses the server/client boundary as `{}`. */
  eligibility?: Record<string, string[]>;
  /** Whether to draw the column heads; the bench under its plate does not. */
  head?: boolean;
  /** These rows are the bench, greyed as Championship Manager greys everyone not in the side. */
  reserve?: boolean;
}) {
  const scored = lines.some((line) =>
    line.players.some((p) => p.points !== undefined),
  );

  return (
    // Above `lg` a row too wide for a half-width panel scrolls inside it; on a phone the name truncates instead.
    // A panel, so the rows sit on a ground and not on the photograph (DESIGN §2).
    <ScrollBoard className={bare ? "" : "cm-panel"}>
      <div className="flex flex-col lg:min-w-max">
        {head ? (
        // `px-1` plus the bevel's 2px border is the row's `px-1.5`, so every head sits over its column.
        <div className={`cm-bevel flex min-h-7 items-center gap-1.5 px-1 ${SMALL_CAPS}`}>
          {/* Centred, as the tile's letters are. */}
          <span className="w-10 shrink-0 text-center">Pos</span>
          <span className="w-7 shrink-0" />
          {/* A basis, not a min-width: the name is the elastic column, and without a floor it renders 0px wide. */}
          <span className="min-w-0 flex-[1_1_5rem]">Player</span>

          {/* Who his CLUB plays this week — the football fixture, not ours. */}
          <span className="w-[5.5rem] shrink-0">Opponent</span>
          {scored ? (
            <span className="w-9 shrink-0 text-center">
              {projected ? "Proj" : "FPts"}
            </span>
          ) : null}
        </div>
        ) : null}

        {/* One list, no group bars: flattening the lines keeps their order without printing the grouping. */}
        <ul className="cm-rows flex flex-col">
          {lines.flatMap((line) =>
            line.players.map((player) => (
              <li key={player.rostered.slot.fantraxId}>
                <SquadRow
                  player={player}
                  eligible={eligibility?.[player.rostered.slot.fantraxId]}
                  onOpen={onOpen && (() => onOpen(player))}
                  reserve={reserve}
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </ScrollBoard>
  );
}
