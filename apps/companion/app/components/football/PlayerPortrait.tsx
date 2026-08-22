"use client";

import Image from "next/image";
import { useState } from "react";
import { type ClubColours, initials, inkOn, portraitUrl } from "@epl/core";

/** How wide he is drawn, and therefore how wide an asset the optimizer may
 *  serve. One number because the two must agree: written out separately they
 *  drift, and the tell is a soft photograph nobody thinks to blame the CSS for. */
const SIZE = 32;

// A player's headshot on their club's colour.
//
// Always sourced at 250x250 and resized by Next's optimizer: the raw PNGs are
// ~330 KB each and a pitch shows eleven of them, so serving them unoptimized
// would cost 3.6 MB on a phone. `sizes` is what tells the optimizer how small it
// may actually go — without it, it ships the full-width asset.

export default function PlayerPortrait({
  player,
  colours,
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
}) {
  const [shown, setShown] = useState<"photo" | "initials">("photo");

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full ring-1 ring-line"
      style={{ backgroundColor: colours.primary, width: SIZE, height: SIZE }}
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
          src={portraitUrl({ code: player.code })}
          alt=""
          width={SIZE}
          height={SIZE}
          sizes={`${SIZE}px`}
          onError={() => setShown("initials")}
          className="relative h-full w-full object-cover object-top"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-2xs font-semibold opacity-85"
          style={{ color: inkOn(colours) }}
        >
          {initials(player.name)}
        </span>
      )}
    </span>
  );
}
