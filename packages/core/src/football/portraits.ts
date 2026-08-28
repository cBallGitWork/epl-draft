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
//   · the size — 110x140 is the only one published; 250x250 now 403s
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
// The file is nominally 110x140 and actually 220x280 at ~105 KB. That covers the
// 88px pitch card and the 112px profile portrait at any pixel density worth
// having. It does NOT cover the front page's lead picture: 176 CSS px is 352
// device px on a 2x phone, `Stories.tsx` asks for that, and Next never enlarges
// — so the app's largest photograph is its softest, and the source is the
// ceiling rather than the encoding. Let
// Next's image optimizer resize and re-encode — fifteen raw PNGs is 1.5 MB of
// pitch on a phone against ~15 KB of WebP apiece — so `unoptimized` must never
// be set on these.

const SIZE = "110x140";

export function portraitUrl(player: Pick<FootballPlayer, "code">): string {
  return `${PL_PHOTO_BASE}/photos/players/${SIZE}/${player.code}.png`;
}

/** Initials for the fallback tile shown while a portrait loads, or when a player
 *  has no headshot yet (common for January signings and academy call-ups). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
