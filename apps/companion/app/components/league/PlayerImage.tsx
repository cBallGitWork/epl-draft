"use client";

import Image from "next/image";
import { useState } from "react";
import { type Club, type FootballPlayer, initials, portraitUrl, shirtUrl } from "@epl/core";

// A player as a cut-out on the grass. A client component: only a failed load proves an asset is missing.
// Five rungs: the large photograph, the small one, ours (`public/portraits/{code}.png`), his kit, his initials.

type Rung = "large" | "photo" | "ours" | "shirt" | "initials";

const NEXT: Record<Exclude<Rung, "initials">, Rung> = {
  large: "photo",
  photo: "ours",
  ours: "shirt",
  shirt: "initials",
};

/** One of ours, if somebody has put one there. Never under `/players/`: a miss there
 *  matches `app/players/[fantraxId]` and fires a live Fantrax profile POST instead of a 404. */
const ourPortrait = (code: number) => `/portraits/${code}.png`;

export default function PlayerImage({
  player,
  club,
  keeper,
  kickedOff,
  sizes = "88px",
  large = false,
}: {
  /** Ask for the 500x500 source instead of the 220x280 one; set `sizes` with it,
   *  or Next serves the big file to an 88px box. */
  large?: boolean;
  player: Pick<FootballPlayer, "code" | "name">;
  club: Club | undefined;
  /** Which of the club's two kits. */
  keeper: boolean;
  /** Whether his match has kicked off (the fixture's answer, not the stat line's); if not, the photograph dims. */
  kickedOff: boolean;
  /** What the optimizer may serve; defaults to his width on a pitch. */
  sizes?: string;
}) {
  const [rung, setRung] = useState<Rung>(large ? "large" : "photo");
  // The last rung must serve nothing, or a kit that fails to load retries the same src as a broken image.
  const source =
    rung === "large"
      ? portraitUrl(player, "large")
      : rung === "photo"
        ? portraitUrl(player)
        : rung === "ours"
        ? ourPortrait(player.code)
        : rung === "shirt"
          ? club && shirtUrl(club, keeper)
          : undefined;

  return (
    // The caller sets the shape and height bound: `.pitch-figure` in `globals.css` reads
    // `--pitch-figure` for the shape and `--pitch-rows` for the ceiling.
    <div className="pitch-figure relative w-full overflow-hidden">
      {source ? (
        <Image
          // Keyed by the rung so a failed src is replaced rather than retried:
          // React would otherwise keep the element and never fire load again.
          key={rung}
          src={source}
          alt=""
          width={110}
          height={145}
          sizes={sizes}
          // A kit straight from FPL, as `PlayerShirt` draws it: the optimizer is refused it.
          unoptimized={rung === "shirt"}
          // A large portrait is its page's Largest Contentful Paint, so Next preloads it.
          priority={large}
          onError={() => setRung(rung === "initials" ? "initials" : NEXT[rung])}
          // Cover, cropped at the top: a cut-out standing on grass keeps its head whole.
          className={`h-full w-full object-cover object-top drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
            kickedOff ? "" : "opacity-80 grayscale-[35%]"
          }`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center font-display text-sm font-bold text-cream/80 ${
            kickedOff ? "" : "opacity-80"
          }`}
        >
          {initials(player.name)}
        </span>
      )}
    </div>
  );
}
