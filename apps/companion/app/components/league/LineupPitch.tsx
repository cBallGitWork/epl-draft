import type { SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import BenchStrip from "./BenchStrip";
import EmptySlot from "./EmptySlot";
import { KIT_RATIO } from "./PlayerShirt";
import SquadMarker from "./SquadMarker";
import type { PitchRow } from "./PitchRows";
import PitchRows, { widestLine } from "./PitchRows";
import { withOpenings } from "./openings";
import { leaguePositionLabel } from "../../positions";

// The XI on the grass and the bench under it, one target per player: tap him to
// pick him, tap him again to put him down.

/** How a player may be tapped right now; `blocked` dims everyone the picked man cannot swap with. */
export type PickState = "picked" | "swappable" | "blocked" | "idle";

function Player({
  player,
  pick,
  onPick,
}: {
  player: SquadPlayerDetail;
  pick: PickState;
  onPick: () => void;
}) {
  const name = playerName(player.rostered);
  const picked = pick === "picked";
  const dim = pick === "blocked";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={dim}
      aria-pressed={picked}
      // What the tap will do; the ring shows it, a screen reader gets the sentence.
      aria-label={
        picked
          ? `Deselect ${name}`
          : pick === "swappable"
            ? `Swap with ${name}`
            : name
      }
      className={`block w-full transition-opacity ${
        picked ? "ring-2 ring-accent" : ""
      } ${pick === "swappable" ? "ring-1 ring-accent/60" : ""} ${dim ? "opacity-30" : ""}`}
    >
      {/* His fixture, not his club: before kickoff `show="points"` would repeat the club on his shirt. */}
      <SquadMarker player={player} show="fixture" />
    </button>
  );
}

/** A free place in a line the picked man can move into, the kit's shape; a tap puts him there. */
function Opening({ position, onPlace }: { position: string; onPlace: () => void }) {
  const label = leaguePositionLabel(position);
  return (
    <button type="button" onClick={onPlace} aria-label={`Move to ${label}`} style={KIT_RATIO} className="block min-h-11 w-full px-1 pt-0.5">
      <EmptySlot label={label} />
    </button>
  );
}

export default function LineupPitch({
  rows,
  bench,
  pickStateOf,
  onPick,
  openings,
  onPlace,
  inColumn = false,
}: {
  rows: PitchRow<SquadPlayerDetail>[];
  bench: SquadPlayerDetail[];
  /** Fill a column rather than bleed through the page's gutters, as beside the list on the desk. */
  inColumn?: boolean;
  pickStateOf: (player: SquadPlayerDetail) => PickState;
  onPick: (player: SquadPlayerDetail) => void;
  /** The positions the picked man can move into with nobody coming off. */
  openings: string[];
  onPlace: (position: string) => void;
}) {
  const lines = withOpenings(rows, openings);
  // One number for the grass and the strip — see `TeamSheet`.
  const widest = widestLine([...lines, { players: bench }]);

  const cell = (player: SquadPlayerDetail) => (
    <Player player={player} pick={pickStateOf(player)} onPick={() => onPick(player)} />
  );

  return (
    // `pitch-with-bench`: the card's height budget allows for the strip below; see `pitch.css`.
    // Second copy of this expression (CODE_RULES §1); a third earns a recipe.
    <div className="pitch-with-bench pitch-own flex flex-col">
      {/* The same `SquadMarker` card a rival's eleven draws. */}
      <PitchRows
        rows={lines}
        keyOf={(at) => (typeof at === "string" ? `open-${at}` : at.rostered.slot.fantraxId)}
        widest={widest}
        inColumn={inColumn}
      >
        {(at) => (typeof at === "string" ? <Opening position={at} onPlace={() => onPlace(at)} /> : cell(at))}
      </PitchRows>

      <BenchStrip bench={bench} rows={lines.length} widest={widest} inColumn={inColumn}>
        {cell}
      </BenchStrip>
    </div>
  );
}
