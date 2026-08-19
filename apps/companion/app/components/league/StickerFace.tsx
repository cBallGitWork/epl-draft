"use client";

import Image from "next/image";
import { useState } from "react";
import { type Club, type FootballPlayer, crestUrl, initials, portraitUrl } from "@epl/core";

// The head panel of a sticker, and the one part of it that has to be a client
// component.
//
// The Premier League's portraits are cut-outs on a transparent ground, so
// anything drawn behind one shows THROUGH the player rather than behind him —
// a crest across his face. The fallback therefore cannot sit underneath and wait
// to be covered; it has to appear only once the image has actually failed, and
// only the browser knows that.
//
// It fails often enough to be worth the boundary: January signings and academy
// call-ups go weeks without a headshot. The club he plays for says more about
// him than his letters do, so the crest goes first and the initials are what is
// left when we cannot name the club either.

export default function StickerFace({
  player,
  club,
  played,
}: {
  player: Pick<FootballPlayer, "code" | "name">;
  club: Club | undefined;
  /** Whether he has appeared this gameweek. A player who has not is drawn back a
   *  little, which is the sticker's own way of saying "nothing yet". */
  played: boolean;
}) {
  const [missing, setMissing] = useState(false);

  return (
    <div
      className="relative block aspect-square overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--color-sticker-backdrop-from), var(--color-sticker-backdrop-to))",
      }}
    >
      {missing ? (
        // The ground here is the sticker's constant studio green, never the
        // club's shirt, so the ink is a constant too — `inkOn` would answer for a
        // colour that is not on screen and come out backwards.
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-display text-lg font-bold text-sticker-keyline opacity-90"
        >
          {club ? (
            <Image src={crestUrl(club)} alt="" width={44} height={44} className="h-[38%] w-[38%]" />
          ) : (
            initials(player.name)
          )}
        </span>
      ) : (
        <Image
          src={portraitUrl(player)}
          alt=""
          width={78}
          height={78}
          sizes="78px"
          onError={() => setMissing(true)}
          // Merlin's four-colour print was loud and a little flat. Matching it is
          // what stops a modern cut-out headshot reading as a stock photo.
          className={`relative h-full w-full object-cover object-[center_12%] saturate-[1.12] contrast-[1.04] ${
            played ? "" : "grayscale-[0.35]"
          }`}
        />
      )}
    </div>
  );
}
