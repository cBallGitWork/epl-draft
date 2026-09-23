"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { clubGroundPhoto } from "@epl/core";
import { drawsOwnGround, isPaperRoute } from "../shell/sections";
import { DESK_GROUND, DESK_GROUND_BLUR } from "../../config";

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

/** **The photograph IS the background** (Craig, 31 Aug, three times). It sat at
 *  opacity 0.30 over brightness 0.25 — about seven per cent of a picture — which
 *  is a dark blue screen with something behind it, not a ground. Championship
 *  Manager's is a darkened photograph at full strength: you can read the trophy
 *  and the red shirts in `cm9900/24.jpg`.
 *
 *  **What changed is not the arithmetic, it is where the text is.** The old
 *  numbers solved a bound for the tightest ink sitting DIRECTLY on the ground.
 *  CM does not put text on its ground — every word is on a plate or inside a
 *  translucent panel — and since the panels landed neither do we. So the bound
 *  moves off the photograph and onto the rule that replaces it, which is the one
 *  CM actually follows:
 *
 *  **Nothing on the desk prints text on the bare ground.** A plate is opaque; a
 *  panel is `--color-surface` at 88%, and through it this photograph contributes
 *  about eight parts in 255 — so the ink ladder inside a panel is still the one
 *  DESIGN §3 measured. Text that appears on the ground is the defect, and the
 *  fix is a panel, not a darker picture.
 *
 *  **And the rule is measured, not asserted.** `node tools/ui/groundfit.mjs`
 *  walks every visible text node on the eight desk routes at both widths and
 *  accumulates background alpha up its real ancestor chain; anything under half
 *  is named. Clean on 31 Aug 2026. Raising DARKEN or SCRIM is safe for exactly
 *  as long as that stays at zero — which is a different guarantee from the
 *  bound above, and a checkable one, where the bound could only ever be stated.
 *
 *  Kept in colour, unlike the portraits it replaced. That comment argued a
 *  photograph in colour "would put a seventh hue on every screen" — true of six
 *  cut-outs floating on the ground, and not of a photograph that IS the ground,
 *  which is what the game did. */
const SCRIM = 1;
const DARKEN = 0.55;

export default function PhotoGround({
  faces = [],
  subject,
}: {
  faces?: readonly string[];
  /** The club this screen is ABOUT, when a subject's own shell is drawing the
   *  ground — its short name, or null for a subject screen with no club to name
   *  (a match FPL has filed without a home side).
   *
   *  Left off entirely by the shell, which is a different thing from null and
   *  the distinction the two branches below turn on: the shell does not know the
   *  club and never will, so on a route whose subject draws its own ground it
   *  stands down. A shell that guessed would load a second photograph behind the
   *  first and pay for a picture nobody sees. */
  subject?: string | null;
}) {
  const pathname = usePathname();
  if (isPaperRoute(pathname)) return null;
  // Asked by the shell, on a route where a Shell below draws its own.
  if (subject === undefined && drawsOwnGround(pathname)) return null;

  // A club with no photograph of its own falls back to the shared ground rather
  // than to nothing: `clubGroundPhoto` answers null for a promoted club, on
  // `portraits.ts`' rule that a stand-in must never look like an answer, and the
  // desk's own picture is not a stand-in for this club — it is the desk's.
  //
  // **The picture and its placeholder travel together**, which is why this is one
  // lookup rather than two: a ground drawn with the wrong club's blur would show
  // the previous stadium for a frame and then cut, which is the very fault the
  // placeholder is here to fix.
  const photo =
    subject === undefined || subject === null ? null : clubGroundPhoto(subject);
  const ground = photo?.src ?? DESK_GROUND;
  const blur = photo === null ? DESK_GROUND_BLUR : photo.blur;
  if (ground === null && faces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-end justify-center gap-[1vw] overflow-hidden"
      // Darkened and not greyed: see the note on the constants above.
      style={{ opacity: SCRIM, filter: `brightness(${DARKEN})` }}
    >
      {ground === null ? (
        // The placeholder, and it is real data rather than an invented stadium:
        // the portraits of men actually in this round, which the app already
        // holds and already optimises for the pitch. A ground nobody in the
        // league plays on would be set dressing.
        faces.map((src) => <Face key={src} src={src} />)
      ) : (
        <Image
          src={ground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
          // **Why a placeholder at all** (Craig, 11 Sep 2026: *"the screen go
          // black when going between images"*). The ground is drawn by the
          // subject's own Shell, so it unmounts and remounts on every
          // navigation; between the two there is a frame with no photograph in
          // it and the near-black `--color-bg` showing through a full-bleed
          // element. This paints in that frame out of the HTML itself, with no
          // request to wait on, and Next fades the real picture in over it.
          //
          // Conditional because `DESK_GROUND_BLUR` is typed null-able with
          // `DESK_GROUND` — they are one picture — and `placeholder="blur"`
          // without a `blurDataURL` throws on a non-static import.
          {...(blur === null
            ? {}
            : { placeholder: "blur" as const, blurDataURL: blur })}
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
