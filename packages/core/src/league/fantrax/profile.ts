// `getPlayerProfile` → what Fantrax knows about one player, asked a tap at a time, never a sweep of the pool. Pure.
// Its figures are the most recent season PLAYED (last season before GW1), so the season is resolved, never assumed.
// Table cells carry HTML, and the endpoint answers any sport's player id: never assume a table is football.

import { recentGames, seasonStats } from "./profileTables";
import type { PlayerMatch, RawTable } from "./profileTables";

export type { PlayerMatch } from "./profileTables";

/** One name-and-value pair: the four blocks' differing shapes all collapse to it. */
export interface LabelledValue {
  /** The short form Fantrax's own UI shows: "FPts", "ADP", "Birthplace". */
  label: string;
  /** Their longer wording, where the season hides ("Fantasy Points (2025-26 - YTD)"); kept whole, never parsed. */
  description: string | null;
  /** Verbatim as Fantrax formats it, "%" and "/" included: "3.55", "100%", "12/46". Never re-derived. */
  value: string;
}

export interface RawLabelled {
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
  /** The season the response describes, as an id resolved against the two seasons the payload names. */
  displayedSelections?: { seasonId?: string };
  season?: RawSeason;
  currentOrRecentSeason?: RawSeason;
  miscData?: {
    name?: string;
    teamShortName?: string;
    /** Fantrax's global position ("M,F"), not our league's eligibility, which arrives on `leagueData`. */
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
  sectionContent?: {
    OVERVIEW?: {
      /** One truncated sentence about his last match. Not read: `getPlayerNews` carries the whole story. */
      latestNews?: { title?: string; subTitle?: string; text?: string };
      /** Five tables; `profileTables.ts` reads the season row by position and the recent games by stat id. */
      tables?: RawTable[];
    };
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
  /** The season every number below describes; null is a real answer, and the UI says so. */
  season: string | null;
  /** OUR league's row: his status or owner, his points here, and this commissioner's eligibility for him. */
  league: LabelledValue[];
  /** Fantrax's own scoring and rankings; points are never recomputed from football facts. */
  highlights: LabelledValue[];
  /** Whole-of-Fantrax, every league on the site: kept apart so "100% rostered" never reads as ours. */
  market: LabelledValue[];
  /** Birthplace, age, height: decoration only, as facts about footballers live in the football layer. */
  personal: LabelledValue[];
  /** His season as Fantrax counts it, with five FPL does not publish: shots, on target, fouls both ways, offsides.
   *  One man at a time, so never a source for a percentile across the division. */
  stats: LabelledValue[];
  /** His recent matches as Fantrax scored them: the only per-match source of OUR league's points.
   *  The window is unknown, so a match table runs on FPL's history and dashes where these do not reach. */
  matches: PlayerMatch[];
}

export function text(value: string | number | undefined): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // Fantrax pads the personal block with other sports' empty rows ("College", "Drafted").
  return trimmed === "" ? null : trimmed;
}

/** A row, or null without a label or a value; `shortName` labels it and `name`, where the season lives, describes it. */
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

/** The displayed season by name, resolved against the seasons the payload names: before GW1 it is not the current one. */
function seasonName(raw: RawPlayerProfile): string | null {
  const shown = raw.displayedSelections?.seasonId;
  if (!shown) return null;
  for (const season of [raw.currentOrRecentSeason, raw.season]) {
    if (season?.id === shown) return season.displayName ?? null;
  }
  return null;
}

/** A player id in Fantrax's shape: five base-36 characters, with room to grow. Club entities have no profile and fail it. */
export function isFantraxPlayerId(id: string): boolean {
  return /^[0-9a-z]{4,8}$/.test(id);
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
    // `percentOwned` and `percentActive` are unread: labelled only "This Week" and so on, and `highlightStats` has both.
    market: rows([misc.percentDrafted, misc.averageDraftPosition].filter((v) => v !== undefined)),
    personal: rows(misc.personalInfo),
    stats: seasonStats(raw),
    matches: recentGames(raw),
  };
}
