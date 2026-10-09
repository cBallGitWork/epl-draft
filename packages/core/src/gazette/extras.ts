import { once } from "./published";
import { normalizeRecord, normalizeSkit, type StorySkit } from "./predictions/cargo";
import type { Marked } from "./predictions/record";
import type { StoryDraftReport } from "./matchups/cargo";
import { normalizeDraftReport } from "./matchups/cargoRead";
import type { StoryReport } from "./reports/cargo";
import { normalizeReports } from "./reports/cargoRead";
import { normalizeSheets, type StorySheet } from "./sheets/cargo";
import { normalizeBin, type StoryBin } from "./binXi/cargo";
import { normalizeApplied, type AppliedMove } from "./season/editor";
import { stringOrEmpty, textOrNull } from "../untrusted";

// The structured cargo a story carries beside its prose, and its normaliser: everything that is not paragraphs.

/** One team's entry in Lawro's power rankings. */
interface StoryRank {
  teamId: string;
  line: string;
}

/** One man's bullet in a club's team news. */
interface StoryTeamNewsMan {
  /** As the paper prints him: first name and surname. */
  name: string;
  /** Our manager who holds him, printed in brackets; absent means he can be claimed. */
  owner?: string;
  /** OUT · Doubt · Suspended · FIT: a closed set, so the column cannot invent a fifth. */
  status: string;
  /** The complaint and what was said, in a few words. */
  note: string;
}

/** One man still out, from the export and never the column. */
interface StoryStillOut {
  name: string;
  /** Our manager who holds him; absent means he can be claimed. */
  owner?: string;
}

/** One club's team news: the crest, a line of context, its men, and at most one
 *  thing its manager actually said. */
interface StoryTeamNews {
  club: string;
  /** FPL's club code for the crest, echoed from the brief and never looked up by name; null prints no crest. */
  code: number | null;
  /** One sentence of context, absent where the club has nothing beyond its lists. Never a retelling of them. */
  line?: string;
  men?: StoryTeamNewsMan[];
  /** Men whose absence is unchanged, as the column named them until 8 Oct 2026: names alone. */
  alsoOut?: string[];
  /** Men whose absence is unchanged, from the desk with who holds each, so they do not bury the bullets that are news. */
  stillOut?: StoryStillOut[];
  /** Who they play this gameweek, attached by the desk from the fixture list, never written by the column. */
  fixture?: StoryFixture;
  /** Carried from the source article, never composed — see `voice/house.ts`. */
  quote?: { text: string; said: string };
}

/** Who a club plays this round, attached by the desk from the fixture list. */
export interface StoryFixture {
  opponent: string;
  home: boolean;
  kickoff: string;
}

/** One man in a predicted eleven. */
export interface StoryLineupMan {
  /** As the paper prints him: first name and surname. */
  name: string;
  /** His real football position, `RCB` or `AM`, never FPL's letter; null where the export had only `element_type`. */
  position: string | null;
  /** The Fantrax team that holds him, named at render; absent is a free agent. */
  owner?: string;
}

/** One club's predicted eleven, in the source's own order. */
export interface StoryLineupSide {
  club: string;
  /** FPL's season-stable club code, for the crest. */
  code: number;
  formation: string;
  men: StoryLineupMan[];
}

/** One fixture and both its predicted elevens. */
export interface StoryLineup {
  home: StoryLineupSide;
  away: StoryLineupSide;
  kickoff: string;
}

/** Each member optional: a story carries only the cargo its kind has. */
export interface StoryExtras {
  ranks?: StoryRank[];
  teamNews?: StoryTeamNews[];
  lineups?: StoryLineup[];
  /** Team news at the lock: each head-to-head's two sides as printed. */
  sheets?: StorySheet[];
  /** Lawro's season record, and the groaners the skit writer landed. */
  record?: Marked;
  skit?: StorySkit[];
  /** A match-day report: each match's score block, pieces, key stats, timeline and video. */
  reports?: StoryReport[];
  /** The Bin XI: the eleven nobody has, its bench and its key stats, as the desk printed them. */
  bin?: StoryBin;
  /** A draft report: the gameweek's match-ups at a cut-off, each with its verdict, writing and form strip. */
  draft?: StoryDraftReport;
  /** Lawro's power rankings: the editor's moves over the code's order, each with the place it had. */
  moves?: AppliedMove[];
}

/** A closed set, so the column cannot invent a fifth state; anything else reads as a doubt, the claim that says least. */
const STATUS = ["OUT", "Doubt", "Suspended", "FIT"];

function men(raw: unknown): StoryTeamNewsMan[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows = raw
    .filter((man): man is StoryTeamNewsMan => typeof man?.name === "string" && man.name.trim() !== "")
    .map((man) => ({
      name: man.name,
      ...(typeof man.owner === "string" && man.owner.trim() !== "" ? { owner: man.owner } : {}),
      status: STATUS.includes(man.status) ? man.status : "Doubt",
      note: stringOrEmpty(man.note),
    }));
  return rows.length > 0 ? once(rows, (man) => man.name) : undefined;
}

function fixture(raw: unknown): StoryFixture | undefined {
  const tie = raw as Partial<StoryFixture> | null;
  if (tie === null || typeof tie !== "object") return undefined;
  if (typeof tie.opponent !== "string" || tie.opponent === "") return undefined;
  if (typeof tie.home !== "boolean" || typeof tie.kickoff !== "string") return undefined;
  return { opponent: tie.opponent, home: tie.home, kickoff: tie.kickoff };
}

function stillOut(raw: unknown): StoryStillOut[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows = raw
    .filter((man): man is StoryStillOut => typeof man?.name === "string" && man.name.trim() !== "")
    .map((man) => ({ name: man.name, ...(typeof man.owner === "string" && man.owner.trim() !== "" ? { owner: man.owner } : {}) }));
  return rows.length > 0 ? once(rows, (man) => man.name) : undefined;
}

function names(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const kept = raw.filter((name): name is string => typeof name === "string" && name.trim() !== "");
  return kept.length > 0 ? [...new Set(kept)] : undefined;
}

function quote(raw: unknown): { text: string; said: string } | undefined {
  const said = raw as Partial<{ text: string; said: string }> | null;
  if (said === null || typeof said !== "object") return undefined;
  if (typeof said.text !== "string" || said.text === "") return undefined;
  if (typeof said.said !== "string" || said.said === "") return undefined;
  return { text: said.text, said: said.said };
}

/** One starter, or nothing: a man with no name is dropped, and only a side left with no men is refused. */
function lineupMan(raw: unknown): StoryLineupMan[] {
  const man = raw as Partial<StoryLineupMan> | null;
  if (man === null || typeof man !== "object") return [];
  if (typeof man.name !== "string" || man.name.trim() === "") return [];
  return [
    {
      name: man.name,
      position: textOrNull(man.position),
      ...(typeof man.owner === "string" && man.owner !== "" ? { owner: man.owner } : {}),
    },
  ];
}

function lineupSide(raw: unknown): StoryLineupSide | null {
  const side = raw as Partial<StoryLineupSide> | null;
  if (side === null || typeof side !== "object") return null;
  if (typeof side.club !== "string" || side.club.trim() === "") return null;
  // A code that is not a real FPL one draws the wrong crest or none.
  if (typeof side.code !== "number" || !Number.isInteger(side.code) || side.code <= 0) return null;
  if (typeof side.formation !== "string" || side.formation === "") return null;
  const men = Array.isArray(side.men) ? side.men.flatMap(lineupMan) : [];
  return men.length === 0
    ? null
    : { club: side.club, code: side.code, formation: side.formation, men };
}

/** A fixture prints both elevens or neither. */
function lineupTie(raw: unknown): StoryLineup[] {
  const tie = raw as Partial<StoryLineup> | null;
  if (tie === null || typeof tie !== "object") return [];
  if (typeof tie.kickoff !== "string" || tie.kickoff === "") return [];
  const home = lineupSide(tie.home);
  const away = lineupSide(tie.away);
  return home === null || away === null ? [] : [{ home, away, kickoff: tie.kickoff }];
}

export function normalizeExtras(raw: unknown): StoryExtras | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const extras = raw as Partial<StoryExtras>;
  const out: StoryExtras = {};

  const ranks = Array.isArray(extras.ranks)
    ? extras.ranks.filter(
        (r): r is StoryRank => typeof r?.teamId === "string" && r.teamId !== "" && typeof r.line === "string",
      )
    : [];
  // Built field by field, never spread: a spread publishes whatever the writer invented beside the shape.
  if (ranks.length > 0) out.ranks = once(ranks, (r) => r.teamId).map((r) => ({ teamId: r.teamId, line: r.line }));

  const clubs = Array.isArray(extras.teamNews)
    ? extras.teamNews.filter((row): row is StoryTeamNews => typeof row?.club === "string" && row.club.trim() !== "")
    : [];
  // Built field by field, never spread: a spread publishes whatever the writer invented beside the shape.
  const printed = clubs
    .map((row): StoryTeamNews => ({
      club: row.club,
      // A club code must be a real FPL one: it draws the crest and joins the fixture.
      code: typeof row.code === "number" && Number.isInteger(row.code) && row.code > 0 ? row.code : null,
      ...(typeof row.line === "string" && row.line.trim() !== "" ? { line: row.line } : {}),
      men: men(row.men),
      alsoOut: names(row.alsoOut),
      stillOut: stillOut(row.stillOut),
      quote: quote(row.quote),
      fixture: fixture(row.fixture),
    }))
    // A crest alone says nothing: a club prints with a line or a list.
    .filter((row) => row.line !== undefined || row.men !== undefined || row.stillOut !== undefined || row.alsoOut !== undefined);
  if (printed.length > 0) out.teamNews = once(printed, (row) => row.club);

  const lineups = Array.isArray(extras.lineups) ? extras.lineups.flatMap(lineupTie) : [];
  if (lineups.length > 0) out.lineups = lineups;
  const sheets = normalizeSheets(extras.sheets);
  if (sheets !== undefined) out.sheets = sheets;

  const record = normalizeRecord(extras.record);
  if (record !== undefined) out.record = record;
  const skit = normalizeSkit(extras.skit);
  if (skit !== undefined) out.skit = skit;
  const reports = normalizeReports(extras.reports);
  if (reports !== undefined) out.reports = reports;
  const bin = normalizeBin(extras.bin);
  if (bin !== undefined) out.bin = bin;
  const draft = normalizeDraftReport(extras.draft);
  if (draft !== undefined) out.draft = draft;
  const moves = normalizeApplied(extras.moves);
  if (moves !== undefined) out.moves = moves;

  return Object.keys(out).length > 0 ? out : undefined;
}
