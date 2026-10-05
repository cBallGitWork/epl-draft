import type { CSSProperties } from "react";
import Image from "next/image";
import { type Club, initials, shirtUrl } from "@epl/core";

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
 *  **Set on this component's own root, not left to the caller.** `.pitch-figure`
 *  reads `--pitch-figure` and falls back to `1.32` — a LANDSCAPE box — so a
 *  caller that forgot to declare the shape letterboxed a portrait kit inside a
 *  wide one and drew it at 63px in a 110px card. `PitchMarker` did exactly that
 *  for one commit. The variable is set on the same element that reads it, which
 *  is legal and is the only arrangement in which no caller can get it wrong.
 *
 *  **No longer exported.** It was, so that the planner's unresolved slot could
 *  draw a dashed box of the same shape with no kit in it; that card went on
 *  21 Sep 2026 and `PitchMarker` draws its own empty slot, so the last reader
 *  outside this file went with it. A hole of the wrong shape in a row is still
 *  the defect the whole file is bounded by — it is just bounded here now. */
/** How much of the kit is drawn, measured off the files rather than judged.
 *
 *  **The kit is LONG** (Craig, 10 Sep 2026: *"our shirts seem a little long"*),
 *  and it is the asset and not the box. Counted that day by walking the alpha
 *  channel of nine of the forty: the shirt inside the 220x290 canvas is
 *  **193x284** for an outfield kit and **207x283** for a keeper's, identical
 *  across every club — so the padding is 2-4px and the visible jersey is
 *  **0.680** wide-to-tall. The sites Craig put beside it draw a shirt at about
 *  0.88. Ours is a photographed full-length jersey; theirs is a stubbier
 *  illustration, and no box arithmetic turns one into the other.
 *
 *  So the hem is cropped. `KEPT` is the fraction of the jersey drawn and the
 *  card's shape is `0.680 / KEPT`, derived rather than typed beside it.
 *
 *  **0.62, which draws the kit slightly WIDER than tall** — 0.680/0.62 = 1.10.
 *  Craig has taken it down twice: 0.80 first (110/129, still visibly upright),
 *  then 0.70 (*"cut them off to make them more square"*), then 0.62 on 11 Sep
 *  2026 (*"the shirt does not need to be that long, we can cut it a lottle"*).
 *
 *  **0.62 is close to the floor and the floor is the sponsor.** These forty files
 *  are shot to one template — collar at 5%, crest at 22%, sponsor band 38-50%,
 *  hem at 97% — so anything above ~0.55 keeps every mark a reader identifies a
 *  club by. Below that the crop starts eating the sponsor, and a kit with half a
 *  sponsor on it looks like a rendering fault rather than a crop.
 *
 *  Cropping the FOOT and not the shoulders is the whole point: the collar, the
 *  crest and the sponsor are the top two thirds, and the hem is the part a
 *  reader identifies nothing by. */
const KEPT = 0.62;

/** The jersey's own shape, off the alpha channel: 193x284 for an outfield kit
 *  inside a 220x290 canvas. The keeper's is 207x283 and the difference is two
 *  hundredths, which is less than the crop moves it. */
const JERSEY = 193 / 284;

/** What the card is therefore shaped like — and it is COMPUTED, because it has to
 *  be true in two places at once: the token `.pitch-figure` reads for the card,
 *  and the inner box that holds the jersey. Written out as `110 / 113` in both,
 *  they were two literals that had to agree about a third number neither of them
 *  named. */
const CARD = JERSEY / KEPT;

const KIT_RATIO = { "--pitch-figure": String(CARD) } as CSSProperties;

export default function PlayerShirt({
  club,
  keeper,
  kickedOff,
  name,
}: {
  club: Club | undefined;
  /** Which of the club's two kits. The keeper's is the `_1` variant and a
   *  genuinely different shirt — long sleeves, its own colours — rather than a
   *  tint, so a keeper drawn in an outfield shirt is wrong in a way a reader
   *  sees before he can say why. */
  keeper: boolean;
  /** Whether his match has kicked off. A man still to play is drawn back — and
   *  it is the shirt that is drawn back, never the card: the name and the
   *  fixture under him are what a waiting player is waiting on. */
  kickedOff: boolean;
  /** Only for the initials a club we cannot name falls to. */
  name: string;
}) {
  // **An early return and not a ternary in the JSX**, because the branch is what
  // decides whether there are colours at all — and a `club!` inside the other
  // half to prove it to the compiler is exactly the non-null assertion the
  // domain rules forbid on provider data.
  if (club === undefined) {
    return (
      <div
        style={KIT_RATIO}
        className="pitch-figure relative w-full overflow-hidden"
      >
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

  return (
    <div
      style={KIT_RATIO}
      className="pitch-figure flex w-full justify-center overflow-hidden"
    >
      {/* **An inner box that IS the kit.** `.pitch-figure` carries an
          aspect-ratio AND a max-height, and on a short viewport the cap wins:
          the box stops being the kit's shape and the shirt no longer fills it.
          `h-full` takes whatever height the cap left and the aspect-ratio
          derives the width, so the box and the jersey inside it are one
          rectangle at every viewport. Bounding it the other way round
          (`max-h-full max-w-full`) let the two disagree.

          It mattered most while a numeral was pinned to this box: it sat on the
          chest at one viewport and below the hem at another. The numeral is gone
          (Craig, 10 Sep 2026: *"ditch the number actually"*) and the box stays,
          because a jersey that is not the shape of its frame is still wrong —
          the crop would simply stop being a crop. */}
      <span style={{ aspectRatio: CARD }} className="relative block h-full overflow-hidden">
        <Image
          src={shirtUrl(club, keeper)}
          alt=""
          width={220}
          height={290}
          // Straight from FPL: Vercel's optimizer is refused the kit (OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED).
          unoptimized
          // **Cover from the TOP, so the crop takes the hem.** `contain` was
          // right while the box was the file's shape and is wrong now that it is
          // the kit's: it would letterbox the jersey back inside the shorter box
          // and undo the crop, which is the same class of mistake as the
          // landscape default this file already records.
          className={`h-full w-full object-cover object-top drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
            kickedOff ? "" : "opacity-80 grayscale-[35%]"
          }`}
        />
      </span>
    </div>
  );
}
