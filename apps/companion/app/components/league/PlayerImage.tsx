"use client";

import Image from "next/image";
import { useState } from "react";
import { type Club, type FootballPlayer, initials, portraitUrl, shirtUrl } from "@epl/core";

// A player, as a cut-out standing on the grass. No card behind him, nothing
// drawn under him — the Premier League's portraits are cut-outs on a
// transparent ground, so the pitch is his background and that is the whole
// look.
//
// It has to be a client component. A transparent PNG cannot be layered over a
// fallback and left to cover it, and the only thing that proves an asset is not
// there is the browser failing to load it — a HEAD request per player would be
// seven hundred of them.
//
// Four rungs: this season's photograph, one of ours, his club's kit, then his
// initials.
//
// Roughly a quarter of players have no photograph in the Premier League's
// current set, and the set before it is two seasons stale — Bruno Guimarães is
// in that gap. Ours fill it: `public/players/{code}.png`, keyed on the same
// season-stable code everything else keys on, dropped in by hand and served from
// our own origin. A missing one costs a local 404 and nothing else.
//
// The kit is the floor, and it is a solid one: a shirt is chosen by club code
// rather than taken of a man, so it is right the day he signs. Initials are only
// reached for a player whose club we cannot name either.

type Rung = "photo" | "ours" | "shirt" | "initials";

const NEXT: Record<Exclude<Rung, "initials">, Rung> = {
  photo: "ours",
  ours: "shirt",
  shirt: "initials",
};

/** One of ours, if somebody has put one there. */
const ourPortrait = (code: number) => `/players/${code}.png`;

export default function PlayerImage({
  player,
  club,
  keeper,
  played,
}: {
  player: Pick<FootballPlayer, "code" | "name">;
  club: Club | undefined;
  /** Which of the club's two kits. A keeper drawn in an outfield shirt is the
   *  kind of quiet wrongness that survives review. */
  keeper: boolean;
  /** Whether he has been on a pitch this round. A man still to play is drawn
   *  back — and it is the photograph that is drawn back, never the card: the
   *  name and the fixture under him are what a waiting player is waiting on. */
  played: boolean;
}) {
  const [rung, setRung] = useState<Rung>("photo");
  const source =
    rung === "photo"
      ? portraitUrl(player)
      : rung === "ours"
        ? ourPortrait(player.code)
        : club && shirtUrl(club, keeper);

  return (
    // Wider than it is tall, and the picture is cropped to fill it from the top:
    // the sponsor up, and nothing below. A full-length cut-out is mostly shorts,
    // and fifteen of them stacked left no daylight between the lines.
    <div className="relative aspect-[1.32] w-full overflow-hidden">
      {source ? (
        <Image
          // Keyed by the rung so a failed src is replaced rather than retried:
          // React would otherwise keep the element and never fire load again.
          key={rung}
          src={source}
          alt=""
          width={110}
          height={145}
          sizes="88px"
          onError={() => setRung(rung === "initials" ? "initials" : NEXT[rung])}
          className={`h-full w-full object-cover object-top drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
            played ? "" : "opacity-80 grayscale-[35%]"
          }`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center font-display text-sm font-bold text-cream/80 ${
            played ? "" : "opacity-80"
          }`}
        >
          {initials(player.name)}
        </span>
      )}
    </div>
  );
}
