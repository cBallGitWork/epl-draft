"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { DESK_GROUND } from "@epl/core";
import { isPaperRoute } from "../shell/sections";

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
// **No instrument can check this, and that is why the bound matters.** `sweep`
// composites a ground up the real ancestor chain, and this is `fixed` at `-z-10`
// — an ancestor of nothing. Every route will report clean whatever is behind it.
// The arithmetic above is the whole guarantee, so it is stated rather than
// sampled: a bound holds for every pixel a photograph could contain, where a
// sample only holds for the one that was tried.
//
// **On the desk and never on the paper.** The Gazetta is ink on stock and a
// match photograph behind newsprint is two registers at once; it asks
// `isPaperRoute` for the same reason the rail does, which is that a server
// layout cannot know which route rendered under it.

/** The two halves of one bound. Their product is what the sum above solves for,
 *  so neither moves without the other. */
const SCRIM = 0.3;
const DARKEN = 0.25;

export default function PhotoGround({ faces }: { faces: readonly string[] }) {
  const pathname = usePathname();
  if (isPaperRoute(pathname)) return null;
  if (DESK_GROUND === null && faces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-end justify-center gap-[1vw] overflow-hidden"
      // Grayscale because a photograph in colour, under a palette where every
      // colour is a slot, would put a seventh hue on every screen. CM's own was
      // in colour and CM's own palette was not this strict.
      style={{ opacity: SCRIM, filter: `grayscale(1) brightness(${DARKEN})` }}
    >
      {DESK_GROUND === null ? (
        // The placeholder, and it is real data rather than an invented stadium:
        // the portraits of men actually in this round, which the app already
        // holds and already optimises for the pitch. A ground nobody in the
        // league plays on would be set dressing.
        faces.map((src) => <Face key={src} src={src} />)
      ) : (
        <Image
          src={DESK_GROUND}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      )}
    </div>
  );
}

/** One of the crowd, and it leaves rather than breaking.
 *
 *  The Premier League's portrait set 403s for better than one player in ten
 *  (CLAUDE.md), and a `next/image` that fails draws the browser's broken-image
 *  box — which on a ground at 30% opacity is a pale rectangle floating behind
 *  the table, exactly the kind of thing nobody reports because it does not look
 *  like a bug. A missing face just leaves a gap in the crowd.
 *
 *  The same rung machine `PlayerImage` and `PlayerPortrait` run, and for the
 *  same reason: a code is no promise of a photograph, so the only way to know is
 *  to let the image say it failed. */
function Face({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <span className="relative h-[42svh] w-[16vw] max-w-[9rem] shrink-0">
      <Image
        src={src}
        alt=""
        fill
        sizes="16vw"
        onError={() => setFailed(true)}
        className="object-contain object-bottom"
      />
    </span>
  );
}
