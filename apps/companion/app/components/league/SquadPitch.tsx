import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import PitchFrame from "./PitchFrame";
import PlayerSticker from "./PlayerSticker";

// All fifteen on the grass, in the lines their manager has them filling.
//
// No bench. A bench is a statement about who starts, and this is the view for
// the days when that is not ours to say — before a period opens, and on a round
// nobody has played yet. Fifteen on the pitch is the honest shape of a squad we
// are allowed to know only the membership of, and nothing here is marked active
// or reserve.
//
// The ground is `PitchFrame`, shared with the matchday XI. The stickers are
// smaller here than on that pitch and deliberately so: fifteen have to stand
// where eleven did, and a phone is 320px wide.

export default function SquadPitch({
  lines,
  onOpen,
}: {
  lines: SquadDetailLine[];
  onOpen: (player: SquadPlayerDetail) => void;
}) {
  return (
    <PitchFrame>
      {lines.map((line) => (
        <ul
          key={line.position}
          // Wraps rather than shrinks: five defenders is a legal line on a
          // 320px phone, and a squashed sticker is unreadable where a second
          // row is merely lower.
          className="flex flex-wrap items-start justify-center gap-1"
          aria-label={`${line.position} — ${line.players.length}`}
        >
          {line.players.map((player) => (
            <li key={player.rostered.slot.fantraxId} className="w-[3.9rem] max-w-[16.2%]">
              <button
                type="button"
                onClick={() => onOpen(player)}
                // Named, because five buttons labelled "D" tell a screen reader
                // nothing about which of the five it is on.
                aria-label={playerName(player.rostered)}
                className="block w-full"
              >
                <PlayerSticker
                  rostered={player.rostered}
                  club={player.club}
                  opposition={player.opposition}
                />
              </button>
            </li>
          ))}
        </ul>
      ))}
    </PitchFrame>
  );
}
