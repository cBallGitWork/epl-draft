import type { CSSProperties } from "react";
import Image from "next/image";
import { type Club, clubColours, initials, inkOn, shirtUrl } from "@epl/core";

// A player on the grass, as his club's kit.
//
// **A shirt and not a photograph** (Craig, 10 Sep 2026: "portraits dont work —
// lets go back to classic shirts for the pitch view that all sites work"). The
// photographs are not missing: counted the same day, the Premier League's
// `110x140` set answers for 51 of 60 random players and `500x500` for 49. What
// they cannot do is agree. `PlayerImage`'s ladder falls from a photograph to one
// of ours to the kit to initials, so a line of eleven reliably contains nine
// faces, a shirt and a set of letters — three different objects standing in one
// row, which is what reads as broken. A kit is keyed on club code, answers 40/40
// (`shirtUrl` carries the count), and is right the day a man signs.
//
// So this is a picture with no fallback ladder and it does not need one. There is
// no `useState`, no `onError`, no `"use client"`: the only absence it can meet is
// a club we cannot name, and it answers that before asking for an image at all.
// That is `crestForShortName`'s own rule — return nothing rather than something
// that merely looks like an answer.

/** The shape of the kit on the grass: the shape of the file it comes from.
 *
 *  FPL ships its shirts at 110x145 and `PitchRows.MAX_CARD` is 110px, so at its
 *  widest a card IS the kit at native size — nothing upscaled, nothing cropped.
 *
 *  **One ratio, exported, because both pitch cards now draw the same asset.**
 *  `PitchPlayer` carried its own `110 / 140` — the PHOTOGRAPH's shape — and
 *  `PitchMarker` forced a square. Neither is the shape of the thing being drawn
 *  any more, and a second copy of a number that is now genuinely shared is the
 *  drift `PitchRows` was already twice amended to remove. */
export const KIT_RATIO = { "--pitch-figure": "110 / 145" } as CSSProperties;

export default function PlayerShirt({
  club,
  keeper,
  number = null,
  kickedOff,
  name,
  fill = false,
}: {
  club: Club | undefined;
  /** Which of the club's two kits. The keeper's is the `_1` variant and a
   *  genuinely different shirt — long sleeves, its own colours — rather than a
   *  tint, so a keeper drawn in an outfield shirt is wrong in a way a reader
   *  sees before he can say why. */
  keeper: boolean;
  /** His shirt number, or null for a pitch that has none to draw.
   *
   *  **Null is the normal answer on four of the six pitches**, and that is the
   *  point rather than a gap: a fantasy eleven wears eleven different kits and
   *  is told apart by them, so a number would be noise. It is the two screens
   *  where all eleven men wear the SAME kit that need one — a real club's
   *  predicted eleven (`IntelPlayer.squadNumber`, 197 of 220 starters on 10 Sep
   *  2026) and a played match's team sheets (`PlSquadMan.shirt`, 30/30). FPL's
   *  own `squad_number` is null on every element and is not one of them. */
  number?: number | null;
  /** Whether his match has kicked off. A man still to play is drawn back — and
   *  it is the shirt that is drawn back, never the card: the name and the
   *  fixture under him are what a waiting player is waiting on. */
  kickedOff: boolean;
  /** Only for the initials a club we cannot name falls to. */
  name: string;
  /** Fill the parent instead of taking `.pitch-figure`'s shape, for a caller
   *  that draws its own frame. */
  fill?: boolean;
}) {
  // **An early return and not a ternary in the JSX**, because the branch is what
  // decides whether there are colours at all — and a `club!` inside the other
  // half to prove it to the compiler is exactly the non-null assertion the
  // domain rules forbid on provider data.
  if (club === undefined) {
    return (
      <div className={`relative w-full overflow-hidden ${fill ? "h-full" : "pitch-figure"}`}>
        <span
          className={`grid h-full w-full place-items-center font-display text-sm font-bold text-cream/80 ${
            kickedOff ? "" : "opacity-80"
          }`}
        >
          {initials(name)}
        </span>
      </div>
    );
  }

  const colours = clubColours(club.shortName);
  const ink = inkOn(colours);

  return (
    <div className={`relative w-full overflow-hidden ${fill ? "h-full" : "pitch-figure"}`}>
      <Image
        src={shirtUrl(club, keeper)}
        alt=""
        width={220}
        height={290}
        // The card's own ceiling. `PitchRows.MAX_CARD` is 110px at every width
        // this app is drawn at, so the optimizer is told that and serves twice it
        // for a retina screen — which is the whole reason `shirtUrl` moved off
        // the 110 file.
        sizes="110px"
        className={`h-full w-full object-contain drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
          kickedOff ? "" : "opacity-80 grayscale-[35%]"
        }`}
      />
      {number === null ? null : (
        /* **Centred on the chest** (Craig, 10 Sep 2026), which is where CM 99/00
           put the number on its own tactics markers and where a reader looks for
           one on a shirt.

           **Ink computed, and a ring under it, and the ring is the load-bearing
           half.** `inkOn` answers for the club's PRIMARY, and `clubColours`
           documents that field as "shirt base — the colour a fan would name
           first", which is the OUTFIELD shirt. Arsenal's `#EF0107` therefore
           returns white, and Arsenal's keeper top is white: seven of the twenty
           are reds whose keeper kits are not red, and three (FUL, LEE, TOT) are
           white clubs whose keeper kits are not white. A per-club keeper palette
           would be a second table to keep true twice a season for one numeral. A
           contrast ring is one rule that survives both kits, and is how a real
           shirt prints a number anyway.

           `paint-order` is not available to HTML text, so the ring is four offset
           shadows — the same trick the name under the card uses, at the opposite
           polarity. */
        <span
          aria-hidden
          className="numeric absolute inset-x-0 top-[38%] text-center text-sm font-bold leading-none lg:text-base"
          style={{ color: ink, textShadow: ring(ink) }}
        >
          {number}
        </span>
      )}
    </div>
  );
}

/** A one-pixel outline in whichever ink the numeral is not.
 *
 *  A function rather than two constants because the pair is decided per club and
 *  the two halves must not be able to drift into the same colour — which is the
 *  failure it exists to prevent. `inkOn` returns one of exactly two strings, so
 *  this is a total function over its real domain rather than a guess. */
function ring(ink: string): string {
  const against = ink === "#ffffff" ? "#0b0c10" : "#ffffff";
  return [`1px 0 0 ${against}`, `-1px 0 0 ${against}`, `0 1px 0 ${against}`, `0 -1px 0 ${against}`].join(
    ", ",
  );
}
