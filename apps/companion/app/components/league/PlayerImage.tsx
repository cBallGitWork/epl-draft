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
// in that gap. Ours fill it: `public/portraits/{code}.png`, keyed on the same
// season-stable code everything else keys on, dropped in by hand and served from
// our own origin. A missing one costs a local 404 and nothing else — which was
// the claim, and was not true while the path was `/players/`; see `ourPortrait`.
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
  fill = false,
}: {
  /** Fill the parent instead of taking `.pitch-figure`'s landscape shape.
   *
   *  **This is what was cropping every disc.** `.pitch-figure` forces
   *  `aspect-ratio: 1.32` — a wide box, right for a cut-out standing on grass
   *  and wrong inside a circle, where it made the image 46x35 in a 46x46 disc
   *  and cut the bottom quarter off. Three attempts at re-cropping and
   *  re-zooming the IMAGE could not fix a box that was the wrong shape; Craig
   *  said so repeatedly and I kept adjusting the wrong thing. A caller drawing
   *  its own frame says so and gets `h-full`. */
  fill?: boolean;
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
  const [rung, setRung] = useState<Rung>("photo");
  // Four rungs, and the fourth has to be able to serve NOTHING — that is what
  // makes it the floor. This used to end `: club && shirtUrl(club, keeper)`,
  // which answers the shirt's own URL at the `initials` rung as well as at
  // `shirt`. So a club we can name but whose kit will not load retried the
  // identical src, `onError` set `initials` over `initials`, `key` did not
  // change, nothing remounted, and the card was left as a broken image: an
  // empty box on the grass, for the one player the fallback exists for.
  const source =
    rung === "photo"
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
    <div className={`relative w-full overflow-hidden ${fill ? "h-full" : "pitch-figure"}`}>
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
          onError={() => setRung(rung === "initials" ? "initials" : NEXT[rung])}
          // **Cover, cropped at the top by default; a round frame moves the
          // crop down.** A cut-out STANDING on grass wants its feet cropped and
          // its head whole, which is `object-top`. In a circle that same crop
          // clips the chin, so `--pitch-crop` lets a caller pin its own vertical
          // offset — the X stays centred either way, which is why only the Y is
          // a variable. The caller owns the number; naming one here would be a
          // second place for it to drift.
          //
          // `--pitch-zoom` is a small scale a round frame can ask for, pinned to
          // the TOP so the crown stays in view as it grows. It earns its place
          // now that the frame is square: the same knob failed twice while the
          // box was `.pitch-figure`'s 1.32 landscape, because scaling cannot fix
          // a frame that is the wrong shape.
          className={`h-full w-full origin-top object-cover [object-position:center_var(--pitch-crop,top)] [scale:var(--pitch-zoom,1)] drop-shadow-[0_2px_3px_oklch(0_0_0/0.45)] ${
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
