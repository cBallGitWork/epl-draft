// `getPlayerProfile` → what Fantrax knows about one player. Pure.
//
// Public on fxpa, and asked one player at a time by a manager tapping a name —
// never a sweep of the pool's 697. The politeness is the design, not a setting.
//
// Three things this payload teaches, all of them from the live probe on 12 Aug
// and all of them load-bearing below:
//
//  1. **The parameter is `playerId`.** `scorerId` — the name Fantrax's own
//     transaction rows give the identical id — and `fantraxId` both answer
//     `INVALID_REQUEST`. Same id space, three names for it, one that works.
//
//  2. **The numbers are not this season's.** `displayedSelections.seasonId` was
//     "925" while `season` said 2026-27 is "926": the profile serves the most
//     recent season that has been played, which before GW1 is last season. Every
//     points figure here therefore belongs to a season that must be named beside
//     it, which is why the season is resolved rather than assumed and why no
//     value is ever parsed out of its label.
//
//  3. **Provenance splits four ways** — this league's row, Fantrax's own scoring,
//     the whole-of-Fantrax market, and the man himself. They arrive interleaved
//     in one `miscData` object and are separated here, because "100% rostered"
//     means every league on the site and reads exactly like a statement about
//     ours.
//
// `sectionContent` — the stats, splits and game-log tables — is refused rather
// than forgotten. It is most of the payload's weight, its columns are keyed by
// numeric stat ids, and nothing on screen asks for it yet.

/** One name-and-value pair, of which this payload is almost entirely made.
 *
 *  Shapes differ across the four blocks — some carry a short name and a long one,
 *  some a name and a description, some just a name — but they collapse to the
 *  same pair, so they get one type and one reader rather than four. */
export interface LabelledValue {
  /** The short form Fantrax's own UI shows: "FPts", "ADP", "Birthplace". */
  label: string;
  /** Their longer wording where there is one — and where the season hides:
   *  "Fantasy Points (2025-26 - YTD)". Kept whole and never parsed. */
  description: string | null;
  /** Verbatim, including the "%" and the "/": "3.55", "100%", "12/46". Fantrax
   *  formats these for display and we are not going to re-derive them (§5). */
  value: string;
}

interface RawLabelled {
  name?: string;
  shortName?: string;
  description?: string;
  /** Numeric on `personalInfo` ("Age": 24) and a string everywhere else. */
  value?: string | number;
}

interface RawSeason {
  id?: string;
  displayName?: string;
}

/** Only the keys we traverse. */
export interface RawPlayerProfile {
  /** Which season the response is actually describing. An id, resolved against
   *  the two seasons the payload names. */
  displayedSelections?: { seasonId?: string };
  season?: RawSeason;
  currentOrRecentSeason?: RawSeason;
  miscData?: {
    name?: string;
    teamShortName?: string;
    /** Fantrax's global position for him, "M,F" — not our league's eligibility,
     *  which is a commissioner setting and arrives on `leagueData`. */
    defaultPosition?: string;
    uniformNumber?: string;
    /** Null for a free agent, and the fantasy team id when someone holds him. */
    ownerTeamId?: string | null;
    percentDrafted?: RawLabelled;
    averageDraftPosition?: RawLabelled;
    highlightStats?: RawLabelled[];
    leagueData?: RawLabelled[];
    personalInfo?: RawLabelled[];
  };
}

/** Everything worth showing about one player, sorted by whose statement it is. */
export interface PlayerIntel {
  name: string;
  clubShortName: string | null;
  defaultPosition: string | null;
  squadNumber: string | null;
  /** Whose team he is on, or nobody's. */
  ownerTeamId: string | null;
  /** The season every number below describes, when the payload named it. Null is
   *  a real answer and the UI says so rather than letting figures stand undated. */
  season: string | null;
  /** OUR league's row: his status or owning team, his points here, and what this
   *  commissioner deems him eligible for. */
  league: LabelledValue[];
  /** Fantrax's own scoring and rankings. Points, and therefore never recomputed
   *  from football facts — that decision is permanent (PLATFORM_NOTES). */
  highlights: LabelledValue[];
  /** Whole-of-Fantrax: every league on the site, not ours. Its own list rather
   *  than fields beside the league's, because "100% rostered" sitting next to our
   *  own ownership is the one number in this payload that invites being read as a
   *  statement about our sixteen managers. */
  market: LabelledValue[];
  /** Birthplace, age, height. Football's, in the loosest sense, and only ever
   *  decoration — the football layer is where facts about footballers live. */
  personal: LabelledValue[];
}

function text(value: string | number | undefined): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // Fantrax pads the personal block with empty rows ("College", "Drafted") for
  // sports that have them. An empty value has nothing to say.
  return trimmed === "" ? null : trimmed;
}

/** A row, or nothing when there is no label or no value to put against it.
 *
 *  `shortName` wins the label because it is what Fantrax's own screens show, and
 *  the longer `name` then becomes the description — which is where the season
 *  lives, so it is kept rather than discarded as a duplicate. */
function row(raw: RawLabelled): LabelledValue | null {
  const label = raw.shortName ?? raw.name;
  const value = text(raw.value);
  if (!label || value === null) return null;
  return { label, description: raw.description ?? (raw.shortName ? (raw.name ?? null) : null), value };
}

function rows(list: RawLabelled[] | undefined): LabelledValue[] {
  const mapped: LabelledValue[] = [];
  for (const raw of list ?? []) {
    const one = row(raw);
    if (one) mapped.push(one);
  }
  return mapped;
}

/** The season being displayed, by name.
 *
 *  Resolved against the seasons the payload itself names rather than assumed to
 *  be the current one: before GW1 those are different seasons, and that is the
 *  whole trap. */
function seasonName(raw: RawPlayerProfile): string | null {
  const shown = raw.displayedSelections?.seasonId;
  if (!shown) return null;
  for (const season of [raw.currentOrRecentSeason, raw.season]) {
    if (season?.id === shown) return season.displayName ?? null;
  }
  return null;
}

export function mapPlayerProfile(raw: RawPlayerProfile): PlayerIntel {
  const misc = raw.miscData ?? {};

  return {
    name: misc.name ?? "",
    clubShortName: misc.teamShortName ?? null,
    defaultPosition: misc.defaultPosition ?? null,
    squadNumber: misc.uniformNumber ?? null,
    ownerTeamId: misc.ownerTeamId ?? null,
    season: seasonName(raw),
    league: rows(misc.leagueData),
    highlights: rows(misc.highlightStats),
    // `percentOwned` and `percentActive` are deliberately not read. They arrive
    // as three items labelled only "This Week", "Last Week" and "Next Week", so
    // taking one means binding to an English name — and both numbers already
    // arrive in `highlightStats` with their meaning spelled out.
    market: rows([misc.percentDrafted, misc.averageDraftPosition].filter((v) => v !== undefined)),
    personal: rows(misc.personalInfo),
  };
}
