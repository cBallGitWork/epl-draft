import { FPL_SHIRT_BASE, PL_ASSET_BASE } from "../config";
import type { Club } from "./types";

// Club colours, grounds, crests and kits, hand-authored and keyed by FPL's `shortName`, which FPL publishes no colours for.
// FPL and Fantrax disagree on some short names (Forest is "NFO" here, "NOT" on Fantrax): never join the two on one.

export interface ClubColours {
  /** Shirt base: the colour a fan would name first. */
  primary: string;
  /** Trim, used for the shirt's accent and contrast text. */
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

/** Neutral pair for a promoted club nobody has styled yet. */
const FALLBACK: ClubColours = { primary: "#4b5563", secondary: "#FFFFFF" };

/** Each club's ground, hand-authored: no provider we hold publishes a venue.
 *  Safe only because FPL carries league matches alone, so the home club names the venue; a neutral cup tie would break it.
 *  The paper is still barred from naming a ground (`gazette/banned.ts`). */
const CLUB_GROUNDS: Record<string, string> = {
  ARS: "Emirates Stadium, London",
  AVL: "Villa Park, Birmingham",
  BOU: "Vitality Stadium, Bournemouth",
  BRE: "Gtech Community Stadium, London",
  BHA: "Amex Stadium, Falmer",
  CHE: "Stamford Bridge, London",
  COV: "Coventry Building Society Arena, Coventry",
  CRY: "Selhurst Park, London",
  EVE: "Hill Dickinson Stadium, Liverpool",
  FUL: "Craven Cottage, London",
  HUL: "MKM Stadium, Hull",
  IPS: "Portman Road, Ipswich",
  LEE: "Elland Road, Leeds",
  LIV: "Anfield, Liverpool",
  MCI: "Etihad Stadium, Manchester",
  MUN: "Old Trafford, Manchester",
  NEW: "St James' Park, Newcastle",
  NFO: "The City Ground, Nottingham",
  TOT: "Tottenham Hotspur Stadium, London",
  SUN: "Stadium of Light, Sunderland",
};

/** The home club's ground, or null (never a guess) for one nobody has written down. */
export function clubGround(shortName: string): string | null {
  return CLUB_GROUNDS[shortName] ?? null;
}

export function clubColours(shortName: string): ClubColours {
  return CLUB_COLOURS[shortName] ?? FALLBACK;
}

/** A club's colours, or the neutral pair for a club the snapshot does not carry. */
export function clubColoursOf(club: Pick<Club, "shortName"> | undefined): ClubColours {
  return clubColours(club?.shortName ?? "");
}

/** FPL's season-stable club `code` by short name, for Fantrax screens that hold only the three letters.
 *  Read off `bootstrap-static`; re-read when the division changes, since a missing club draws no crest. */
const CLUB_FPL_CODES: Record<string, number> = {
  ARS: 3,
  AVL: 7,
  BHA: 36,
  BOU: 91,
  BRE: 94,
  CHE: 8,
  COV: 9,
  CRY: 31,
  EVE: 11,
  FUL: 54,
  HUL: 88,
  IPS: 40,
  LEE: 2,
  LIV: 14,
  MCI: 43,
  MUN: 1,
  NEW: 4,
  NFO: 17,
  SUN: 56,
  TOT: 6,
};

/** The crest for a club known only by short name, or null (never a fallback badge) when unknown. */
export function crestForShortName(shortName: string): string | null {
  const code = CLUB_FPL_CODES[shortName];
  return code === undefined ? null : crestUrl({ code });
}

/** The club's SVG crest, keyed on its season-stable `code`. */
export function crestUrl(club: Pick<Club, "code">): string {
  return `${PL_ASSET_BASE}/badges/t${club.code}.svg`;
}

/** White or near-black, whichever contrasts more with the club's primary; the better of two bad answers on a mid-grey. */
export function inkOn(colours: ClubColours): string {
  return contrast(colours.primary, "#ffffff") >= contrast(colours.primary, INK)
    ? "#ffffff"
    : INK;
}

/** A subject's title-bar plate: its primary colour with the ink that survives it, always computed as a pair. */
export function plateOn(colours: ClubColours): { background: string; ink: string } {
  return { background: colours.primary, ink: inkOn(colours) };
}

/** The desk's near-black, for a plate that wants dark ink. */
const INK = "#0b0c10";

/** WCAG 2.1 relative luminance, not luma: skipping the sRGB linearisation gives white ink on a mid-tone orange. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channels = [0, 2, 4].map((at) => parseInt(h.slice(at, at + 2), 16) / 255);
  const [r, g, b] = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The club's outfield or keeper kit by club code; `-220` is the largest size the host serves (`-440` is a 404). */
export function shirtUrl(club: Club, keeper: boolean): string {
  return `${FPL_SHIRT_BASE}/shirt_${club.code}${keeper ? "_1" : ""}-220.png`;
}
