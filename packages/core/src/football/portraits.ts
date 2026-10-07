import { PL_PHOTO_BASE } from "../config";
import type { FootballPlayer } from "./types";

// Premier League headshots, PNG only, keyed by the season-stable `code`; `premierleague25` is their string, not a season.
// Never fall back to the old `/premierleague/…/250x250/p{code}.png`: it still answers 200 with August 2024's photographs.
// Never set `unoptimized` on these: raw PNGs cost a phone 1.5 MB a pitch.

/** The two sizes anything draws: `small` (a real 220x280) for discs and cut-outs, `large` (500x500) for a portrait. */
const SIZES = { small: "110x140", large: "500x500" } as const;

type PortraitSize = keyof typeof SIZES;

export function portraitUrl(
  player: Pick<FootballPlayer, "code">,
  size: PortraitSize = "small",
): string {
  return `${PL_PHOTO_BASE}/photos/players/${SIZES[size]}/${player.code}.png`;
}

/** Initials for the fallback tile shown while a portrait loads, or when a player has no headshot. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
