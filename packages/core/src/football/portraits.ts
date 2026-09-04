import { PL_PHOTO_BASE } from "../config";
import type { FootballPlayer } from "./types";

// Player portraits. The Premier League hosts a headshot per player keyed by the
// player's stable `code` (NOT the per-season element id).
//
// The path moved and we did not notice for a season. The old one — the same host
// under `/premierleague/photos/players/250x250/p{code}.png` — still answers 200,
// which is why nothing broke and nothing complained: it serves the set as it
// stood in **August 2024**, so Isak was still in a Newcastle shirt two clubs
// later and three of our fifteen had no photograph at all. Found by reading
// FPL's own bundle (19 Aug 2026) rather than by guessing at a prefix.
//
// Three things changed together, so all three are asserted by the test below:
//   · the prefix — `premierleague25`, theirs, not a season we compute
//   · the filename — `{code}.png`, no `p`
//   · the size — see below; 250x250 still 403s under this prefix
//
// The old path is deliberately NOT kept as a second choice for the handful of
// players the current set has no photograph of. It would put those few back in
// the shirts they wore two clubs ago, which is the failure this replaced — and a
// wrong photograph is worse than no photograph, because only one of the two
// looks like an answer. Those players get their club's crest, same as a player
// with no photograph anywhere.
//
// PNG only — webp/jpg variants 403 on both paths.
//
// **There are two sizes worth asking for, and we found the second late.**
// Counted across 120 random players on 4 Sep 2026:
//
//     110x140   105/120   serves a real 220x280 PNG, despite the name
//     500x500   104/120   serves a real 500x500 PNG
//     220x280    12/120   mostly a genuine 404, not a block
//
// `250x250`, `330x330`, `150x200`, `660x840` and every `.webp` 403 outright.
//
// **The `220x280` row is why this is counted rather than quoted.** A single
// player was probed first — he had it, and the ladder was written up as though
// both small paths were the same image under two names. They are not: one in ten
// players has that path at all. Nothing asks for it, and nothing should.
//
// This file used to say the source was the ceiling at 220x280, and the front
// page's soft lead picture was blamed on it. That was wrong — 500x500 was there
// the whole time, 2.27x the linear resolution, and nothing in the tree asked for
// it. The ceiling is real but it sits more than twice as high as recorded.
//
// The two we ask for are the same men: overlap 104 of the 105 and 104 — **no
// player has the large without the small, and one in a hundred and twenty has
// the small without the large**. So LARGE falls back to SMALL and only then to
// the rest of the ladder, and that first rung fires about once a squad.
//
// 15 of the 120 have no photograph at any size — one in eight, not the quarter
// this comment used to claim. Let
// Next's image optimizer resize and re-encode — fifteen raw PNGs is 1.5 MB of
// pitch on a phone against ~15 KB of WebP apiece — so `unoptimized` must never
// be set on these.

/** The two sizes anything draws. `small` is the row disc and the pitch cut-out;
 *  `large` is a portrait given room to be looked at. */
const SIZES = { small: "110x140", large: "500x500" } as const;

/** Not exported from the package: `portraitUrl` is the only caller and every
 *  consumer passes a literal. An exported type nothing imports is §2's unused
 *  export, and the day a second reader needs it is the day it moves. */
type PortraitSize = keyof typeof SIZES;

export function portraitUrl(
  player: Pick<FootballPlayer, "code">,
  size: PortraitSize = "small",
): string {
  return `${PL_PHOTO_BASE}/photos/players/${SIZES[size]}/${player.code}.png`;
}

/** Initials for the fallback tile shown while a portrait loads, or when a player
 *  has no headshot yet (common for January signings and academy call-ups). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
