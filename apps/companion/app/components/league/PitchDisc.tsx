import type { CSSProperties } from "react";
import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  clubColours,
  isResolved,
  kickedOff,
  playerName,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import PlayerPortrait from "../football/PlayerPortrait";
import { positionLabel } from "../../positions";

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

/** How wide the head is drawn. Named here because the plate under it is sized
 *  against the CARD and the head against itself — a disc that grew with a
 *  two-man front line would stand a third larger than the same man in a back
 *  five, which is the trap `PitchRows` records for the sticker. */
const HEAD = "2.75rem";

export default function PitchDisc({
  rostered,
  club,
  opposition,
  points,
}: {
  rostered: RosteredPlayer;
  club: Club | undefined;
  opposition?: Opposition[];
  /** What our league scores him this period. Undefined is no table at all,
   *  null a table that does not name him. */
  points?: number | null;
}) {
  const resolved = isResolved(rostered) ? rostered : null;
  const started = kickedOff(opposition);

  return (
    <div
      className="flex w-full flex-col items-center gap-1"
      style={{ "--row-portrait": HEAD } as CSSProperties}
    >
      <PlayerPortrait
        player={{
          // A slot the bridge has not settled has no face and no code; the
          // portrait falls back to his initials on the club's colour, and an
          // unsettled slot has no club either, so it lands on the neutral.
          code: resolved?.player.code ?? null,
          name: resolved
            ? resolved.player.name
            : (positionLabel(rostered.slot.position) ?? "?"),
        }}
        colours={clubColours(club?.shortName ?? "")}
        chrome
      />

      <span className="flex w-full items-center justify-center overflow-hidden bg-cream px-0.5 text-center font-display text-3xs font-bold uppercase leading-none text-bg">
        <span className="w-full truncate">{playerName(rostered)}</span>
      </span>

      {started ? (
        <span className="numeric w-full bg-bg px-0.5 text-center text-2xs font-bold leading-none text-cream">
          {points ?? "—"}
        </span>
      ) : (
        <span className="flex w-full items-stretch overflow-hidden">
          <FixtureChip opposition={opposition} blank={club?.shortName ?? "—"} />
        </span>
      )}
    </div>
  );
}
