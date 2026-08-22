import { clubColours, isGoalkeeper } from "@epl/core";
import type { Club, FootballPlayer, FplLine, FplPick } from "@epl/core";
import PitchRows from "../components/league/PitchRows";
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
          keeper={isGoalkeeper(LINE_LETTER[pick.line] ?? null)}
          // Everyone on this pitch has kicked off or is about to: FPL publishes a
          // side only for a round it has started scoring. The drawn-back state
          // belongs to our own league's pitch, where a Monday night fixture is
          // three days off.
          kickedOff
          sizes="88px"
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
        className={`flex h-[1.15rem] w-full items-center justify-center overflow-hidden bg-cream px-0.5 text-center font-display font-bold uppercase leading-none tracking-[-0.01em] text-bg ${NAME_SIZE}`}
      >
        <span className="w-full truncate">{player?.name ?? "—"}</span>
      </span>

      <span
        className="numeric flex h-[1.15rem] w-full items-center justify-center gap-1 rounded-b-[3px] bg-bg/85 px-0.5 text-[0.625rem] font-bold leading-none text-cream"
        style={{ backgroundColor: club ? clubColours(club.shortName).primary : undefined }}
      >
        {pick.points}
      </span>
    </div>
  );
}

/** The same size on every card, truncating — the pitch's rule, and this pitch
 *  obeys it too. */
const NAME_SIZE = "text-[clamp(7px,13cqw,11px)]";

/** FPL's line numbers as the letter `isGoalkeeper` reads. Only the keeper's
 *  answer is used — it picks which of a club's two kits to draw behind a man
 *  with no photograph — so the other three exist to make the lookup total rather
 *  than because anything asks them. */
const LINE_LETTER: Record<number, string> = { 1: "G", 2: "D", 3: "M", 4: "F" };
