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
// Five rungs: the large photograph, the small one, one of ours, his club's kit,
// then his initials.
//
// The first rung only exists for a caller that asked for `large`, and it is
// cheap insurance rather than a real branch: the Premier League's 500x500 set
// and its 110x140 set are the same men to within one player in a hundred and
// twenty (`portraits.ts` records the count), so it fires about once a squad.
//
// One player in eight has no photograph in the Premier League's current set —
// 15 of a random 120 on 4 Sep 2026, down from the quarter this comment claimed
// while the set was worse — and the set before it is two seasons stale — Bruno Guimarães is
// in that gap. Ours fill it: `public/portraits/{code}.png`, keyed on the same
// season-stable code everything else keys on, dropped in by hand and served from
// our own origin. A missing one costs a local 404 and nothing else — which was
// the claim, and was not true while the path was `/players/`; see `ourPortrait`.
//
// The kit is the floor, and it is a solid one: a shirt is chosen by club code
// rather than taken of a man, so it is right the day he signs. Initials are only
// reached for a player whose club we cannot name either.

type Rung = "large" | "photo" | "ours" | "shirt" | "initials";

const NEXT: Record<Exclude<Rung, "initials">, Rung> = {
  large: "photo",
  photo: "ours",
  ours: "shirt",
  shirt: "initials",
};

/** One of ours, if somebody has put one there.
 *
 *  **`/portraits/`, and never `/players/`.** That was a real path on this app —
 *  `app/players/[fantraxId]` — so a miss did not 404: it matched the route with
 *  `fantraxId = "123456.png"`, which fires a live Fantrax profile POST for an id
 *  that is not a player, renders 24 KB of refusal HTML, returns it 200, and
 *  hands that to the image optimizer, which answers 400. Roughly a quarter of
 *  the pool has no current photograph, so a pitch of fifteen was making several
 *  of those per render — against the one provider whose politeness policy is
 *  written down two files away ("one profile per tap, never a sweep of the
 *  697"). A static path with no route behind it 404s, costs nothing, and is
 *  read by nobody. */
const ourPortrait = (code: number) => `/portraits/${code}.png`;

export default function PlayerImage({
  player,
  club,
  keeper,
  kickedOff,
  sizes = "88px",
  large = false,
}: {
  /** Ask for the 500x500 source instead of the 220x280 one.
   *
   *  For a portrait with room to be looked at, and nothing else — it is 249 KB
   *  against 83, which is right for one man on his own page and wrong for
   *  fifteen on a pitch. A caller that sets this must also set `sizes`, or Next
   *  will serve the big file down to an 88px box for no gain. */
  large?: boolean;
  player: Pick<FootballPlayer, "code" | "name">;
  club: Club | undefined;
  /** Which of the club's two kits. A keeper drawn in an outfield shirt is the
   *  kind of quiet wrongness that survives review. */
  keeper: boolean;
  /** Whether his match has kicked off. A man still to play is drawn back — and
   *  it is the photograph that is drawn back, never the card: the name and the
   *  fixture under him are what a waiting player is waiting on.
   *
   *  The fixture's question, not the stat line's: FPL carries a row for every
   *  player in the league from the round's first whistle, so "he has a stat
   *  line" stopped meaning "he has been on a pitch" the moment a season began. */
  kickedOff: boolean;
  /** What the optimizer is allowed to serve. Defaults to the width he is drawn
   *  at on a pitch, which is where all fifteen of him appear; the profile page
   *  draws one of him several times that size and would otherwise be handed an
   *  88px asset to fill it — soft in exactly the place a reader is looking
   *  hardest. */
  sizes?: string;
}) {
  const [rung, setRung] = useState<Rung>(large ? "large" : "photo");
  // The LAST rung has to be able to serve NOTHING — that is what makes it the
  // floor. This used to end `: club && shirtUrl(club, keeper)`,
  // which answers the shirt's own URL at the `initials` rung as well as at
  // `shirt`. So a club we can name but whose kit will not load retried the
  // identical src, `onError` set `initials` over `initials`, `key` did not
  // change, nothing remounted, and the card was left as a broken image: an
  // empty box on the grass, for the one player the fallback exists for.
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
    // The shape and the height bound are the CALLER's, because only the caller
    // knows how much room it has: `.pitch-figure` in `globals.css` reads
    // `--pitch-figure` for the shape and `--pitch-rows` for the ceiling, and a
    // caller that sets neither gets the old crop and no ceiling at all.
    //
    // Both assets behind this are portraits: the Premier League's photograph is
    // 110×140 and FPL's kit is 110×145. A box wider than it is tall therefore
    // throws away most of both, which is why the default is the thing a caller
    // overrides rather than the thing every caller lives with.
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
          // A LARGE portrait is the largest thing on its page by construction,
          // so it is the Largest Contentful Paint and Next asks for it to be
          // preloaded rather than discovered. Tied to `large` rather than given
          // a prop of its own: the one caller that wants the big source is the
          // one caller whose image is the LCP, and a second flag would be a
          // second thing to keep in step (CODE_RULES §1).
          priority={large}
          onError={() => setRung(rung === "initials" ? "initials" : NEXT[rung])}
          // **Cover, cropped at the top.** A cut-out STANDING on grass wants its
          // feet cropped and its head whole, which is `object-top`.
          //
          // It used to read `--pitch-crop` and `--pitch-zoom` so that a ROUND
          // frame could pin its own vertical offset and scale up inside the
          // circle. `PitchDisc` was the only thing that ever set them and it
          // became `PitchMarker` on 10 Sep 2026, which draws a kit and no
          // circle — so both variables had a reader here and no writer
          // anywhere. A variable nothing sets is its own fallback with extra
          // steps.
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
