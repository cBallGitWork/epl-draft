import { once } from "./published";
import { normalizeRecord, normalizeSkit, type StorySkit } from "./predictions/cargo";
import type { Marked } from "./predictions/record";
import type { StoryReport } from "./reports/cargo";
import { normalizeReports } from "./reports/cargoRead";
import { normalizeSheets, type StorySheet } from "./sheets/cargo";
import { normalizeBin, type StoryBin } from "./binXi/cargo";

// The structured cargo some story kinds carry beside their prose: a power
// ranking's rows, and the wire's quiz. Its own file because it is its own
// contract — the prose is paragraphs whatever the kind, and this is everything
// that is not paragraphs.
//
// **QUOTES went on 3 Sep 2026 with the two sketches that were their only
// consumers**, Craig on the press room and the studio: *"this is rubbish,
// ditch."* They were the paper's one licensed invention — the doctrine was that
// a sketch announced as a sketch may put words in a manager's mouth — and the
// exception is gone with the columns that needed it. Nothing in this paper
// invents a quote now, which is the plainer rule and the one HOUSE already
// states without an asterisk.
//
// **The eleven's CAPTIONS were deleted on 3 Sep 2026**, Craig: *"the
// descriptiosn are the same 'STAT + quippy bit', pure ai shite."* He is right
// and it was structural: one sentence per man, asked for eleven at a time,
// against a brief that gives each man a name, a slot and a stat line. There is
// nothing else for that sentence to be. The eleven keeps its column — the
// argument connecting the side is prose a pundit can actually write — and the
// side itself is printed from the facts, unannotated.

/** One team's entry in a power ranking. */
interface StoryRank {
  teamId: string;
  /** Places moved since last time; 0 is held, negative is fell. */
  move: number;
  line: string;
}

/** One man's line in a club's team news. A bullet, not a sentence in a
 *  paragraph — Craig, 18 Sep 2026: "maybe we bullet point each player?". Prose
 *  per club gave six rows of one sentence-shape and "knock" eight times; a
 *  bullet has nowhere to put filler. */
interface StoryTeamNewsMan {
  /** As the paper prints him: first name and surname. */
  name: string;
  /** Our manager who holds him, printed in brackets. Absent means unowned,
   *  which is information — he is the one you can claim. */
  owner?: string;
  /** OUT · Doubt · Suspended · FIT — the scannable word, and a closed set so
   *  the column cannot invent a fifth. */
  status: string;
  /** The complaint and what was said, in a few words. */
  note: string;
}

/** One club's team news: the crest, a line of context, its men, and at most one
 *  thing its manager actually said. */
interface StoryTeamNews {
  club: string;
  /** FPL's club code, for the crest. The BRIEF gives it on the same line as the
   *  club's name and the writer echoes it back — it is never looked up from the
   *  name, which would be the runtime name-matching CODE_RULES §3 forbids. Null
   *  when it did not come back as a number, and the row then prints without a
   *  crest rather than with the wrong one. */
  code: number | null;
  /** One sentence of context. Never a retelling of the bullets. */
  line: string;
  men?: StoryTeamNewsMan[];
  /** Men whose absence is unchanged — out for weeks, nothing said today. A tail
   *  line rather than bullets: 86% of a day's men are these, and bulleting them
   *  buried the handful that were news. */
  alsoOut?: string[];
  /** Who they play this round, attached by the DESK from the fixture list and
   *  never written by the column — both reviewers called its absence the worst
   *  hole on the page, and one proved it: a manager's quote said the squad was
   *  "coming to Brentford" while Brentford had its own section four inches
   *  below, so the fixture was on the page twice and never joined up. */
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
  /** His REAL football position — `RCB`, `AM` — and never FPL's fantasy letter.
   *  Null where the export had only `element_type` to go on. */
  position: string | null;
  /** The Fantrax team that holds him, joined to a name at render the way a rank
   *  is. Absent is a free agent. */
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

interface StoryQuizItem {
  q: string;
  a: string;
}

/** Optional per member: a power ranking carries rows and nothing else, a wire
 *  may carry a quiz. */
export interface StoryExtras {
  ranks?: StoryRank[];
  quiz?: StoryQuizItem[];
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
}

/** A closed set, so the column cannot invent a fifth state. Anything else is a
 *  doubt, which is the reading that claims least. */
// **"Back" was renamed to FIT on 18 Sep 2026.** It sat in the same list as
// "Ilyas Ansah — OUT, back", where back is the injury, so one word carried two
// opposite meanings three lines apart.
const STATUS = ["OUT", "Doubt", "Suspended", "FIT"];

function men(raw: unknown): StoryTeamNewsMan[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rows = raw
    .filter((man): man is StoryTeamNewsMan => typeof man?.name === "string" && man.name.trim() !== "")
    .map((man) => ({
      name: man.name,
      ...(typeof man.owner === "string" && man.owner.trim() !== "" ? { owner: man.owner } : {}),
      status: STATUS.includes(man.status) ? man.status : "Doubt",
      note: typeof man.note === "string" ? man.note : "",
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

/** One starter, or nothing. A man the desk could not name is dropped here and
 *  his whole side is refused above — ten men under an eleven's formation is the
 *  failure `xiFault` exists to stop. */
function lineupMan(raw: unknown): StoryLineupMan[] {
  const man = raw as Partial<StoryLineupMan> | null;
  if (man === null || typeof man !== "object") return [];
  if (typeof man.name !== "string" || man.name.trim() === "") return [];
  return [
    {
      name: man.name,
      position: typeof man.position === "string" && man.position !== "" ? man.position : null,
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

/** A tie prints both elevens or neither: one side under a heading naming two is
 *  a fixture half-reported. */
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
        (r): r is StoryRank =>
          typeof r?.teamId === "string" && r.teamId !== "" &&
          typeof r.move === "number" && typeof r.line === "string",
      )
    : [];
  if (ranks.length > 0) out.ranks = once(ranks, (r) => r.teamId);

  const quiz = Array.isArray(extras.quiz)
    ? extras.quiz.filter(
        (item): item is StoryQuizItem =>
          typeof item?.q === "string" && item.q !== "" && typeof item.a === "string" && item.a !== "",
      )
    : [];
  if (quiz.length > 0) out.quiz = quiz;

  const teamNews = Array.isArray(extras.teamNews)
    ? extras.teamNews.filter(
        (row): row is StoryTeamNews =>
          typeof row?.club === "string" && row.club.trim() !== "" &&
          typeof row.line === "string" && row.line.trim() !== "",
      )
    : [];
  if (teamNews.length > 0) {
    // **Built field by field, never spread.** `...row` published whatever the
    // writer invented alongside the shape — a `manager` and a `verdict` field
    // reached `paper.json` — and a story is a contract, not a bag.
    out.teamNews = once(teamNews, (row) => row.club).map((row) => ({
      club: row.club,
      // A club code must be a real FPL one: it draws the crest and joins the
      // fixture, and `-1` and `1.5` both reached `crestUrl` unchallenged.
      code: typeof row.code === "number" && Number.isInteger(row.code) && row.code > 0 ? row.code : null,
      line: row.line,
      men: men(row.men),
      alsoOut: names(row.alsoOut),
      quote: quote(row.quote),
      fixture: fixture(row.fixture),
    }));
  }

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

  return Object.keys(out).length > 0 ? out : undefined;
}
