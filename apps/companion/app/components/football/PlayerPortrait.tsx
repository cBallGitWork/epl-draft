import Image from "next/image";
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
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full ring-1 ring-line"
      style={{ backgroundColor: colours.primary, width: SIZE, height: SIZE }}
    >
      {/* Initials INSTEAD of a photograph, never underneath one. They used to
          sit under it as a fallback, which works for a rectangle and not for
          these: the Premier League's portraits are cut-outs on transparency, so
          a man's initials showed through his own shirt on every row of the pool.
          January signings and academy call-ups still get them — 120 of the pool
          have no headshot at all — but only when there is nothing on top. */}
      {player.code === null ? (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-2xs font-semibold opacity-85"
          style={{ color: inkOn(colours) }}
        >
          {initials(player.name)}
        </span>
      ) : (
        <Image
          src={portraitUrl({ code: player.code })}
          alt=""
          width={SIZE}
          height={SIZE}
          sizes={`${SIZE}px`}
          className="relative h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}
