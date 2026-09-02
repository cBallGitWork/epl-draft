import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  isResolved,
  kickedOff,
  playerName,
} from "@epl/core";
import type { Instruction } from "@epl/core";
import PlayerImage from "./PlayerImage";

// One player on Championship Manager's pitch: a head, a name, and what he is
// worth. The marker half of the `CmGround` trial.
//
// **A cut-out head where CM had a numbered disc** (Craig, 31 Aug — "numbered
// discs aren't ideal for us… let's trial player cut out"). We have no number to
// draw: FPL's `squad_number` is a key that is null on all 622 elements, which
// `CLAUDE.md` records as a fact rather than a gap. A face is what we do have,
// and `PlayerPortrait` already draws one as a disc — the club's colour behind
// it, his initials when the photograph 403s, and the whole fallback ladder that
// took a day to get right. It sizes off `--row-portrait`, so this sets that and
// nothing else.
//
// **The name stays, unlike CM's.** The game gets away with bare numbers because
// the squad list stands beside the pitch carrying the same numbers; ours is a
// toggle, so a nameless pitch would be fifteen strangers. On a cream plate and
// not on the grass: white type at nine pixels over grass was tried and is
// recorded as unreadable.
//
// **The fixture stays too** (Craig, same message): the coloured box is handy
// here, where a manager is picking a side and the card has room for it. It came
// off the list in the same change.
//
// **The disc is chrome and never the club's colour** (Craig, 31 Aug: "colour
// scheme doesn't work does it? With the circles"). It was `colours.primary`
// first, which put twenty brand palettes on a green field in a register where
// every colour is a slot — the exact thing `PhotoGround` greyscales a photograph
// to avoid, and the exact thing `PitchPlayer` had already removed when it
// dropped the sticker's backing for "nothing behind them at all". CM's own pitch
// is four colours. The club still reads, out of the photograph rather than out
// of the palette, which is where a kit belongs.

export default function PitchDisc({
  rostered,
  club,
  opposition,
  points,
  instruction,
}: {
  rostered: RosteredPlayer;
  club: Club | undefined;
  opposition?: Opposition[];
  /** What our league scores him this period. Undefined is no table at all,
   *  null a table that does not name him. */
  points?: number | null;
  /** Whether the shape has him pushing forward — see `join/tactics.ts`. */
  instruction?: Instruction;
}) {
  const resolved = isResolved(rostered) ? rostered : null;
  const started = kickedOff(opposition);

  return (
    <div className="relative flex w-full flex-col items-center gap-0.5">
      {/* **The arrow, above the man who is going forward** — which is how the
          shot draws it and, more to the point, is the only mark on CM's pitch
          that says anything about intent. Ours is derived from the shape rather
          than from an instruction, because Fantrax sells a roster slot and no
          tactic; `join/tactics.ts` carries the rule and the reasoning.

          `aria-hidden`, and the instruction is not otherwise announced: it is a
          restatement of the formation printed in words above the pitch, so a
          reader who cannot see it has already been told. */}
      {instruction === "forward" ? (
        <span
          aria-hidden
          className="absolute -top-3 font-chrome text-sm font-bold leading-none text-accent"
        >
          ↑
        </span>
      ) : null}

      {/* **The cut-out, with nothing behind it** (Craig, 2 Sep: "use the player
          portrait but not background"). `PlayerPortrait` drew a chrome DISC
          under every head — CM's numbered circle with a face in it — and the
          circle is the half we do not need: the game draws a disc because it
          has a number to put in one, and we have a photograph, which is its own
          shape. `PlayerImage` is the cut-out ladder the pitch already uses
          elsewhere, so a man with no photograph still reads as somebody. */}
      <span className="relative block h-11 w-11 overflow-hidden">
        {resolved === null ? (
          /* A slot the bridge has not settled has no footballer behind it and
             so no portrait to fall back through. His position on a plain plate
             says what the pitch actually knows about him, which is where he is
             standing — and `SquadRows` prints "unmapped" on the same man, so
             the two readings agree. */
          <span className="grid h-full w-full place-items-center bg-surface font-display text-3xs font-bold uppercase text-faint">
            {rostered.slot.position || "?"}
          </span>
        ) : (
          <PlayerImage
            player={resolved.player}
            club={club}
            keeper={rostered.slot.position === "G"}
            kickedOff
            sizes="44px"
          />
        )}
      </span>

      {/* **The name on the grass, in white, as the game sets it.** It was on a
          cream PLATE — added when white-at-nine-pixels over grass was found
          unreadable — and the shot says the answer was the wrong one: CM puts
          white type straight on the pitch and makes it legible by being bigger
          and bolder, not by putting a card behind it. A row of cream plates
          reads as fifteen labels; the grass should show between the players.

          The drop shadow is what buys the contrast the plate was buying, and it
          costs no ground: `groundfit` measures text on the BARE ground and a
          shadowed glyph over grass still fails that test, which is why the
          pitch is exempt — it is a photograph of grass we drew, not the
          match photograph the rule is about. */}
      <span className="w-full truncate px-0.5 text-center font-display text-2xs font-bold uppercase leading-none text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
        {playerName(rostered)}
      </span>

      {/* His score, or his fixture before a ball is kicked. On the dark plate
          CM uses for a figure on grass. */}
      <span className="numeric w-full bg-bg/80 px-0.5 text-center text-2xs font-bold leading-none text-cream">
        {started ? (points ?? "—") : (club?.shortName ?? "—")}
      </span>
    </div>
  );
}
