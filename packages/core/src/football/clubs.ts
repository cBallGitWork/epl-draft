import { FPL_SHIRT_BASE, PL_ASSET_BASE } from "../config";
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

/** Where each club plays. Twenty rows, on `CLUB_COLOURS`' own argument.
 *
 *  **No provider we hold publishes a venue.** FPL's fixture carries none;
 *  SofaScore's match payload carries `venue_lat`/`venue_lon` and both are null
 *  on every 26-27 row we have captured, and its event block has no venue object
 *  at all (checked 4 Sep 2026). So this is hand-authored, exactly as the colours
 *  are, and for the same reason: twenty rows that change about once a decade,
 *  against scraping something and getting it subtly wrong.
 *
 *  **Safe because FPL publishes one competition.** Every fixture in the football
 *  layer is a league match at the home club's own ground, so the home club names
 *  the venue and there is no neutral tie to get wrong. A cup semi-final at
 *  Wembley would break that, and there is no cup in the feed to break it with —
 *  `docs/ui/prem.md` records the same limit for the fixture list's competition
 *  column.
 *
 *  `gazette/banned.ts` forbids the PAPER from naming a ground, and that stands:
 *  it is a rule about a language model recalling one, not about a table somebody
 *  wrote down. This is the table, and the paper still may not reach for it. */
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

/** The home club's ground, or null for one nobody has written down.
 *
 *  Null and never a guess: a promoted club arrives every August and a made-up
 *  ground under a real club's name is the confident wrong answer DESIGN §7
 *  refuses. The caption falls back to naming the round instead. */
export function clubGround(shortName: string): string | null {
  return CLUB_GROUNDS[shortName] ?? null;
}

export function clubColours(shortName: string): ClubColours {
  return CLUB_COLOURS[shortName] ?? FALLBACK;
}

/** Club crest. `code` is FPL's season-stable club code, so these URLs keep working
 *  across seasons. SVG scales to any size for free — prefer it over the PNGs. */
export function crestUrl(club: Pick<Club, "code">): string {
  return `${PL_ASSET_BASE}/badges/t${club.code}.svg`;
}

/** Some colours are near-white and a white label on them vanishes. Pick the
 *  readable ink for text sitting on one.
 *
 *  **Whichever of the two actually contrasts more, computed** — not a brightness
 *  guess. This asked Rec. 601 luma whether the ground was "light" and took white
 *  whenever it was not, which is a different question from the one that matters
 *  and gets a different answer on a saturated mid-tone: a #e08a00 orange scores
 *  0.58 luma, reads as "dark", and takes white ink at **2.69:1** — half the AA
 *  floor. `tools/ui/sweep.mjs` found three such pairs the day the fantasy teams
 *  got colours of their own, because a hand-authored palette of twenty clubs had
 *  happened not to contain one.
 *
 *  Every one of the twenty clubs gets the same ink it got before, so this is a
 *  fix rather than a restyle — checked against the whole table, and the two
 *  tightest (Arsenal 4.49, Sunderland 4.48) were already as good as their reds
 *  allow either way round.
 *
 *  It is still not a guarantee: a mid-grey has no readable ink at all and this
 *  returns the better of two bad answers rather than pretending. The palette is
 *  hand-authored and `sweep` measures it, which is where a real floor is kept. */
export function inkOn(colours: ClubColours): string {
  return contrast(colours.primary, "#ffffff") >= contrast(colours.primary, INK)
    ? "#ffffff"
    : INK;
}

/** The filled plate a SUBJECT's title bar is drawn on, in its own colours.
 *
 *  `cm9900/25.jpg` is Everton and `21.jpg` is Everton against Arsenal: when a CM
 *  screen is about somebody rather than about the competition, the bar is filled
 *  with their colour and the title takes whichever ink survives it. The pair is
 *  always computed together — a background without its ink is the half of the
 *  decision that makes a pale club unreadable — so it is one call.
 *
 *  Extracted at three: `squad/[teamId]/Shell` for a fantasy side,
 *  `prem/club/[code]/Shell` for a club, and the club's own match header, which
 *  draws two of them against each other. It takes the colours rather than the
 *  subject because the two layers name their subjects differently — a team id
 *  and a club's short name — and only the colours are common. */
export function plateOn(colours: ClubColours): { background: string; ink: string } {
  return { background: colours.primary, ink: inkOn(colours) };
}

/** The desk's near-black, for a plate that wants dark ink. */
const INK = "#0b0c10";

/** WCAG 2.1 relative luminance, which is what a contrast ratio is defined on —
 *  and is not luma. The sRGB channels are linearised first; skipping that step
 *  is the whole of the bug above. */
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

/** The club's kit, keyed on the same stable club code as the crest.
 *
 *  110x145 and about 10 KB. Forty of these — one outfield and one keeper per
 *  club — cover every player in the league, which is why they cache far better
 *  than a portrait per man and why they are never out of date: the shirt follows
 *  the club a player is at now, not the club he was at when someone last
 *  photographed him. */
export function shirtUrl(club: Club, keeper: boolean): string {
  return `${FPL_SHIRT_BASE}/shirt_${club.code}${keeper ? "_1" : ""}-110.png`;
}
