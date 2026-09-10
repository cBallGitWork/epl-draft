"use client";

import Image from "next/image";
import { useState } from "react";
import { type ClubColours, initials, inkOn, portraitUrl } from "@epl/core";

/** How wide an asset the optimizer may serve — the LARGEST slot any caller draws
 *  him in, because asking for a smaller one and drawing him larger is a soft
 *  photograph nobody thinks to blame the CSS for.
 *
 *  How wide he is actually DRAWN is `--row-portrait`, which `desk.css` shrinks
 *  with the row that carries him and `league/PitchMarker` raises to 44px for a
 *  marker on the grass. That third caller is why this is 44 and not 32: the
 *  ceiling stood at 32 for an afternoon while the pitch drew 44 off it, which is
 *  exactly the failure the paragraph above forbids, in the file that forbids it.
 *  A row's 22–26px slot fetching a 44px source costs a few hundred bytes; a
 *  blurred face on the one screen built around faces costs the screen. */
const PORTRAIT_PX = 44;

/** What `large` asks the optimizer for.
 *
 *  The source ladder has a 500x500 rung (`portraits.ts`) meant for "a portrait
 *  given room to be looked at", and the analysis bar is the first disc with that
 *  much room — 72px on a desk against a row's 22. Drawing the 110x140 source at
 *  that size is the soft photograph the constant above exists to prevent, in the
 *  one place a reader is looking hardest. 96 rather than 72 so a 2x screen has
 *  something to work with. */
const LARGE_PX = 96;

// A player's headshot on their club's colour.
//
// Always sourced at 250x250 and resized by Next's optimizer: the raw PNGs are
// ~330 KB each and a pitch shows eleven of them, so serving them unoptimized
// would cost 3.6 MB on a phone. `sizes` is what tells the optimizer how small it
// may actually go — without it, it ships the full-width asset.

export default function PlayerPortrait({
  player,
  colours,
  chrome = false,
  large = false,
}: {
  player: {
    /** FPL's season-stable player code, or **null** for a man FPL has never
     *  listed — 120 of the 688 in Fantrax's pool are academy names, and the
     *  bridge records that as a settled outcome rather than a failure. Null
     *  drops the photograph and keeps everything else: the same circle, in his
     *  club's colour, with his initials on it. A rung of the fallback chain
     *  reached before the network rather than after it. */
    code: number | null;
    name: string;
  };
  /** The club's colours. The portrait sits on `primary`, so the crop reads as a
   *  kit rather than a floating cutout, and the fallback initials take whichever
   *  ink survives it — Fulham, Leeds and Spurs are near-white. */
  colours: ClubColours;
  /** Draw the disc in chrome instead of the club's colour.
   *
   *  For the pitch, and it is a palette decision rather than a taste one. In a
   *  ROW the club's colour is the identifying mark and there is one of it per
   *  line, on the desk's own ground. On a PITCH there are fifteen at once, on
   *  green, and they are twenty brand palettes let into a register where every
   *  colour is a slot with one meaning — PRODUCT.md says club colours are brand
   *  values and not chosen for contrast, and `PhotoGround` refuses colour
   *  photography for the same reason one step further on.
   *
   *  Championship Manager's own pitch is four colours (`cm9900/19.jpg`, sampled
   *  rather than remembered): the field — two greens, mown — one blue for every
   *  outfielder at `#0023a5`, one green for the keeper at `#037d0c`, and white
   *  numbers. We draw all eleven the same and give the keeper nothing, which is
   *  one of those four colours left on the table. Chrome
   *  is this app's "frame, and never content" slot — the title bar and the index
   *  cell — so a disc cut from it is a marker rather than a claim. Ink on it is
   *  7.0:1, which is what the initials fall back to. */
  chrome?: boolean;
  /** Ask for the 500x500 source instead of the 110x140 one, for a disc drawn big
   *  enough that the small file would be visibly soft. The caller still sets the
   *  BOX, through `--row-portrait`; this only says which asset fills it. */
  large?: boolean;
}) {
  const [shown, setShown] = useState<"photo" | "initials">("photo");

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full ring-1 ring-line"
      style={{
        backgroundColor: chrome ? "var(--color-chrome)" : colours.primary,
        width: "var(--row-portrait)",
        height: "var(--row-portrait)",
      }}
    >
      {/* Initials INSTEAD of a photograph, never underneath one — and never
          instead of one that exists.

          They used to sit under it always, which works for a rectangle and not
          for these: the Premier League's portraits are cut-outs on transparency,
          so a man's initials showed through his own shirt on every row of the
          pool. Moving them into an `else` on `code === null` fixed that and
          broke the larger case, because a code is no promise of a photograph —
          the current set 403s for better than one player in ten, and those
          rendered as a bare coloured disc with nothing in it.

          So the fallback is reached the only way it can be: by the image saying
          it failed. That is what makes this a client component, and it is the
          same rung machine `PlayerImage` runs for the same reason. */}
      {shown === "photo" && player.code !== null ? (
        <Image
          src={portraitUrl({ code: player.code }, large ? "large" : "small")}
          alt=""
          width={large ? LARGE_PX : PORTRAIT_PX}
          height={large ? LARGE_PX : PORTRAIT_PX}
          sizes={`${large ? LARGE_PX : PORTRAIT_PX}px`}
          onError={() => setShown("initials")}
          className="relative h-full w-full object-cover object-top"
        />
      ) : (
        <span
          aria-hidden
          className={`absolute inset-0 grid place-items-center font-semibold opacity-85 ${large ? "text-lg" : "text-2xs"}`}
          style={{ color: chrome ? "var(--color-ink)" : inkOn(colours) }}
        >
          {initials(player.name)}
        </span>
      )}
    </span>
  );
}
