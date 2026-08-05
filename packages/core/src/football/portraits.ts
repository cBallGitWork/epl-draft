import type { FootballPlayer } from "./types";

// Player portraits. FPL hosts a headshot per player keyed by the player's stable
// `code` (NOT the per-season element id). Verified sizes: 40x40 (~16 KB),
// 110x140 (~108 KB), 250x250 (~330 KB). PNG only — webp/jpg variants 403.
//
// Always request 250x250 and let Next's image optimizer resize and re-encode it:
// eleven raw 330 KB PNGs is 3.6 MB of pitch on a phone, whereas the optimizer
// serves ~15 KB WebP apiece. Hence `unoptimized` must never be set on these.

const BASE = "https://resources.premierleague.com/premierleague/photos/players";

export type PortraitSize = "40x40" | "110x140" | "250x250";

export function portraitUrl(
  player: Pick<FootballPlayer, "code">,
  size: PortraitSize = "250x250",
): string {
  return `${BASE}/${size}/p${player.code}.png`;
}

/** Initials for the fallback tile shown while a portrait loads, or when a player
 *  has no headshot yet (common for January signings and academy call-ups). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
