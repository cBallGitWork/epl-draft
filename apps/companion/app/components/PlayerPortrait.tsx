import Image from "next/image";
import { type ClubColours, type FootballPlayer, initials, inkOn, portraitUrl } from "@epl/core";

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
  player: Pick<FootballPlayer, "code" | "name">;
  /** The club's colours. The portrait sits on `primary`, so the crop reads as a
   *  kit rather than a floating cutout, and the fallback initials take whichever
   *  ink survives it — Fulham, Leeds and Spurs are near-white. */
  colours: ClubColours;
}) {
  return (
    <span
      className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-line"
      style={{ backgroundColor: colours.primary }}
    >
      {/* Initials sit underneath as the fallback: January signings and academy
          call-ups routinely have no headshot for weeks, and a broken image icon
          is a worse answer than their initials. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-2xs font-semibold opacity-85"
        style={{ color: inkOn(colours) }}
      >
        {initials(player.name)}
      </span>
      <Image
        src={portraitUrl(player, "250x250")}
        alt=""
        width={32}
        height={32}
        sizes="32px"
        className="relative h-full w-full object-cover object-top"
      />
    </span>
  );
}
