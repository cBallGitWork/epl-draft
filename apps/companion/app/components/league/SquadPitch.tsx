import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import PitchPlayer from "./PitchPlayer";
import PitchRows from "./PitchRows";

// All fifteen on the grass, in the lines their manager has them filling.
//
// No bench. A bench is a statement about who starts, and this is the view for
// the days when that is not ours to say — before a period opens, and on a round
// nobody has played yet. Fifteen on the pitch is the honest shape of a squad we
// are allowed to know only the membership of, and nothing here is marked active
// or reserve.
//
// The ground and the row sizing are `PitchRows`, shared with the matchday XI
// and with your own lineup.

export default function SquadPitch({
  lines,
  onOpen,
}: {
  lines: SquadDetailLine[];
  onOpen: (player: SquadPlayerDetail) => void;
}) {
  return (
    <PitchRows
      rows={lines.map((line) => ({ label: line.position, players: line.players }))}
      keyOf={(player) => player.rostered.slot.fantraxId}
    >
      {(player) => (
        <button
          type="button"
          onClick={() => onOpen(player)}
          // Named, because five buttons labelled "D" tell a screen reader
          // nothing about which of the five it is on.
          aria-label={playerName(player.rostered)}
          className="block w-full"
        >
          <PitchPlayer
            rostered={player.rostered}
            club={player.club}
            opposition={player.opposition}
            points={player.points}
          />
        </button>
      )}
    </PitchRows>
  );
}
