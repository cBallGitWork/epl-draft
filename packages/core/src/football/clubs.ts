import { PL_ASSET_BASE } from "../config";
import type { Club } from "./types";

// Club visual identity. FPL serves crests but publishes no colours, so the palette
// is hand-authored here — it's twenty rows that change once a season, which is far
// cheaper than scraping and getting it subtly wrong.
//
// Keyed by FPL's `shortName` because that is what the API actually returns. Note
// FPL and Fantrax disagree on some labels (Forest is "NFO" here, "NOT" on Fantrax) —
// never join the two on short name, join on player identity.

export interface ClubColours {
  /** Shirt base — the colour a fan would name first. */
  primary: string;
  /** Trim/secondary, used for the shirt's accent and contrast text. */
  secondary: string;
}

const CLUB_COLOURS: Record<string, ClubColours> = {
  ARS: { primary: "#EF0107", secondary: "#FFFFFF" },
  AVL: { primary: "#670E36", secondary: "#95BFE5" },
  BOU: { primary: "#DA291C", secondary: "#000000" },
  BRE: { primary: "#E30613", secondary: "#FFFFFF" },
  BHA: { primary: "#0057B8", secondary: "#FFFFFF" },
  CHE: { primary: "#034694", secondary: "#FFFFFF" },
  COV: { primary: "#78D0F3", secondary: "#FFFFFF" },
  CRY: { primary: "#1B458F", secondary: "#C4122E" },
  EVE: { primary: "#003399", secondary: "#FFFFFF" },
  FUL: { primary: "#FFFFFF", secondary: "#000000" },
  HUL: { primary: "#F5A12D", secondary: "#000000" },
  IPS: { primary: "#3A64A3", secondary: "#FFFFFF" },
  LEE: { primary: "#FFFFFF", secondary: "#1D428A" },
  LIV: { primary: "#C8102E", secondary: "#00B2A9" },
  MCI: { primary: "#6CABDD", secondary: "#1C2C5B" },
  MUN: { primary: "#DA291C", secondary: "#FBE122" },
  NEW: { primary: "#241F20", secondary: "#FFFFFF" },
  NFO: { primary: "#DD0000", secondary: "#FFFFFF" },
  TOT: { primary: "#FFFFFF", secondary: "#132257" },
  SUN: { primary: "#EB172B", secondary: "#FFFFFF" },
};

/** Neutral fallback so a promoted club we haven't styled still renders sanely
 *  rather than crashing or showing a hole. */
const FALLBACK: ClubColours = { primary: "#4b5563", secondary: "#FFFFFF" };

export function clubColours(shortName: string): ClubColours {
  return CLUB_COLOURS[shortName] ?? FALLBACK;
}

/** Club crest. `code` is FPL's season-stable club code, so these URLs keep working
 *  across seasons. SVG scales to any size for free — prefer it over the PNGs. */
export function crestUrl(club: Pick<Club, "code">): string {
  return `${PL_ASSET_BASE}/badges/t${club.code}.svg`;
}

/** Some clubs' primary is near-white, so a white label on it vanishes. Pick the
 *  readable ink for text sitting on the club's primary colour. */
export function inkOn(colours: ClubColours): string {
  return isLight(colours.primary) ? "#0b0c10" : "#ffffff";
}

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Rec. 601 luma — good enough for a contrast decision, and dependency-free.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
