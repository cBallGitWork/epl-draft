import type { CSSProperties } from "react";
import Image from "next/image";
import { type Club, initials, shirtUrl } from "@epl/core";

// A player on the grass as his club's kit; a club we cannot name falls to his initials.

/** The fraction of the jersey drawn, cropped at the hem; below ~0.55 the crop eats the sponsor. */
const KEPT = 0.62;

/** The jersey's shape inside its 220x290 canvas, off the alpha channel (an outfield kit). */
const JERSEY = 193 / 284;

/** The card's shape, computed: `.pitch-figure` and the jersey's inner box must agree on it. */
const CARD = JERSEY / KEPT;

/** The kit's shape, for `.pitch-figure` on the element that reads it: the class falls back to a landscape 1.32 and
 *  letterboxes a kit. Exported for the planner's empty box, which stands beside the kits. */
export const KIT_RATIO = { "--pitch-figure": String(CARD) } as CSSProperties;

export default function PlayerShirt({
  club,
  keeper,
  kickedOff,
  name,
}: {
  club: Club | undefined;
  /** Which of the club's two kits; the keeper's is the `_1` variant. */
  keeper: boolean;
  /** Whether his match has kicked off; if not, the shirt dims and the card does not. */
  kickedOff: boolean;
  /** Only for the initials a club we cannot name falls to. */
  name: string;
}) {
  // An early return, so the other branch needs no `club!` assertion on provider data.
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
      className="pitch-figure flex w-full items-start justify-center overflow-hidden"
    >
      {/* The kit's own box, sized from its WIDTH against the figure's cap: WebKit reads `h-full` under an
          aspect-ratio as auto, so the kit drew the card's full width and lost its foot. */}
      <span style={{ aspectRatio: CARD, width: `min(100%, var(--pitch-cap) * ${CARD})` }} className="relative block overflow-hidden">
        <Image
          src={shirtUrl(club, keeper)}
          alt=""
          width={220}
          height={290}
          // Straight from FPL: Vercel's optimizer is refused the kit (OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED).
          unoptimized
          // Cover from the top, so the crop takes the hem; `contain` would letterbox it back.
          className={`h-full w-full object-cover object-top drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
            kickedOff ? "" : "opacity-80 grayscale-[35%]"
          }`}
        />
      </span>
    </div>
  );
}
