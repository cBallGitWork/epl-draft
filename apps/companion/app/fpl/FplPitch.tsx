import { clubColours, inkOn, isFplKeeper } from "@epl/core";
import type { Club, FootballPlayer, FplLine, FplPick } from "@epl/core";
import PitchRows, { NAME_SIZE } from "../components/league/PitchRows";
import PlayerImage from "../components/league/PlayerImage";

// Your FPL XI on the grass.
//
// The same ground and the same row sizing as our own league's pitches — that is
// `PitchRows`, and reusing it is the whole reason the FPL tab could have a pitch
// at all. What it could not reuse is `PitchPlayer`: that cell takes a
// `RosteredPlayer`, which is a Fantrax roster slot joined to a footballer, and an
// FPL pick is neither. Second occurrence of a sticker on grass, so it is a copy
// (CODE_RULES §1) — and the two genuinely differ, because only this one has a
// captain and only the other has a fixture chip.
//
// **Every number here is FPL's, already multiplied.** A captain's 18 is what he
// contributed, not what he scored, which is the number a manager is looking for.

export default function FplPitch({
  rows,
  players,
  clubs,
}: {
  rows: FplLine[];
  players: Map<number, FootballPlayer>;
  clubs: Map<number, Club>;
}) {
  return (
    <PitchRows
      rows={rows.map((row) => ({ label: row.label, players: row.players }))}
      keyOf={(pick: FplPick) => String(pick.code)}
    >
      {(pick) => <Sticker pick={pick} players={players} clubs={clubs} />}
    </PitchRows>
  );
}

function Sticker({
  pick,
  players,
  clubs,
}: {
  pick: FplPick;
  players: Map<number, FootballPlayer>;
  clubs: Map<number, Club>;
}) {
  const player = players.get(pick.code);
  const club = player ? clubs.get(player.clubId) : undefined;

  return (
    <div className="@container flex w-full flex-col">
      <span className="relative block">
        <PlayerImage
          player={player ?? { code: pick.code, name: "" }}
          club={club}
          keeper={isFplKeeper(pick.line)}
          // Everyone on this pitch has kicked off or is about to: FPL publishes a
          // side only for a round it has started scoring. The drawn-back state
          // belongs to our own league's pitch, where a Monday night fixture is
          // three days off.
          kickedOff
        />
        {/* The armband, where a shirt carries it. Vice only when there is no
            captain to outrank him would be wrong: FPL names both, and which one
            actually scored double is decided after the fact. */}
        {pick.isCaptain || pick.isViceCaptain ? (
          <span
            aria-hidden
            className={`absolute left-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full text-[0.5rem] font-bold ${
              pick.isCaptain ? "bg-info text-bg" : "bg-black/60 text-cream"
            }`}
          >
            {pick.isCaptain ? "C" : "V"}
          </span>
        ) : null}
      </span>

      <span
        className={`flex h-[var(--pitch-band)] w-full items-center justify-center overflow-hidden bg-cream px-0.5 text-center font-display font-bold uppercase leading-none tracking-[-0.01em] text-bg ${NAME_SIZE}`}
      >
        <span className="w-full truncate">{player?.name ?? "—"}</span>
      </span>

      {/* His club's colour, with the ink that survives it. It was a flat
          `text-cream`, which is near-white on the three clubs whose primary IS
          near-white — Fulham, Leeds and Spurs — so the one number the band exists
          to show vanished. `inkOn` is in the football layer for exactly this and
          every other surface already asks it. */}
      <span
        className="numeric flex h-[var(--pitch-band)] w-full items-center justify-center gap-1 rounded-b-[3px] px-0.5 text-[0.625rem] font-bold leading-none"
        style={
          club
            ? { backgroundColor: clubColours(club.shortName).primary, color: inkOn(clubColours(club.shortName)) }
            : undefined
        }
      >
        {pick.points}
      </span>
    </div>
  );
}

