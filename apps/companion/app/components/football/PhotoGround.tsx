import Image from "next/image";
import { portraitUrl } from "@epl/core";
import type { FootballPlayer } from "@epl/core";

// The players, behind the screen. Championship Manager drew every screen over a
// darkened match photograph, and dropping it is most of why a retokened desk
// still read as a website.
//
// **It was dropped for a stated reason and the reason was checkable.** DESIGN §2
// says the photograph "fails AA outright and no amount of scrim fixes a ground
// that changes under the text". The second half is wrong, and the arithmetic is
// short: a scrim at opacity α over `--color-bg` can never composite lighter than
// `α × white + (1 − α) × bg`, whatever the photograph contains. That is a bound,
// so it can be solved. At α = 0.06 the worst pixel a photograph can hold — pure
// white — leaves `--color-faint`, the tightest ink in the palette, at 4.61:1. At
// 0.08 it lands on 4.35 and fails.
//
// **But α is the wrong dial, because the photograph's own brightness is the
// other half of the product.** Darken the picture first and the same bound buys
// far more of it: at `brightness(0.25)` the brightest pixel it can hold is 64
// rather than 255, so opacity 0.30 composites no lighter than 0.06 did at full
// strength — faint 4.65:1, bad 4.86:1 — and the photograph is five times as
// present. Measured 30 Aug 2026. The PRODUCT of the two is the bound; moving
// either one re-opens the sum.
//
// Real players rather than stock photography: these are the portraits of the men
// actually on the screen, which the app already holds and already optimises for
// the pitch. A stadium nobody in the league plays in would be set dressing.

/** The two halves of one bound. Their product is what the sum above solves for,
 *  so neither moves without the other. */
const SCRIM = 0.3;
const DARKEN = 0.25;

/** Enough faces to read as a crowd, few enough to stay one request each and to
 *  keep the composite legible. */
const FACES = 6;

export default function PhotoGround({ players }: { players: readonly FootballPlayer[] }) {
  const faces = players.filter((player) => portraitUrl(player) !== null).slice(0, FACES);
  if (faces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 flex h-[42svh] items-end justify-center gap-[1vw] overflow-hidden"
      // Grayscale because a photograph in colour, under a palette where every
      // colour is a slot, would put a seventh hue on every screen. CM's own was
      // in colour and CM's own palette was not this strict.
      style={{ opacity: SCRIM, filter: `grayscale(1) brightness(${DARKEN})` }}
    >
      {faces.map((player) => (
        <span key={player.code} className="relative h-full w-[16vw] max-w-[9rem] shrink-0">
          <Image
            src={portraitUrl(player) as string}
            alt=""
            fill
            sizes="16vw"
            className="object-contain object-bottom"
          />
        </span>
      ))}
    </div>
  );
}
