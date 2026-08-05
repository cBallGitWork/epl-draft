import Image from "next/image";
import { type FootballPlayer, initials, portraitUrl } from "@epl/core";

// A player's headshot on their club's colour.
//
// Always sourced at 250x250 and resized by Next's optimizer: the raw PNGs are
// ~330 KB each and a pitch shows eleven of them, so serving them unoptimized
// would cost 3.6 MB on a phone. `sizes` is what tells the optimizer how small it
// may actually go — without it, it ships the full-width asset.

const SIZES = {
  sm: { px: 32, box: "h-8 w-8", text: "text-2xs" },
  md: { px: 44, box: "h-11 w-11", text: "text-xs" },
  lg: { px: 64, box: "h-16 w-16", text: "text-sm" },
} as const;

export default function PlayerPortrait({
  player,
  clubColour,
  size = "md",
  className = "",
}: {
  player: Pick<FootballPlayer, "code" | "name">;
  /** The club's primary colour — the portrait sits on it, so the crop reads as a
   *  kit rather than a floating cutout. */
  clubColour: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full ring-1 ring-line ${s.box} ${className}`}
      style={{ backgroundColor: clubColour }}
    >
      {/* Initials sit underneath as the fallback: January signings and academy
          call-ups routinely have no headshot for weeks, and a broken image icon
          is a worse answer than their initials. */}
      <span
        aria-hidden
        className={`absolute inset-0 grid place-items-center font-semibold text-white/85 ${s.text}`}
      >
        {initials(player.name)}
      </span>
      <Image
        src={portraitUrl(player, "250x250")}
        alt=""
        width={s.px}
        height={s.px}
        sizes={`${s.px}px`}
        className="relative h-full w-full object-cover object-top"
      />
    </span>
  );
}
