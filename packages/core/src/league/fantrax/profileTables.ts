import { plainText } from "./markup";
import type { LabelledValue, RawLabelled, RawPlayerProfile } from "./profile";
import { numeric } from "./stats";

// `getPlayerProfile`'s TABLES, found by shape or stat id and never by caption, which is a season string it has served wrong.
// Cells carry HTML (`<b>D</b>: 2`), stripped here; another sport's id renders wrong labels, not wrong numbers.

export interface RawTable {
  caption?: string;
  header?: { cells?: (RawLabelled & { key?: string })[] };
  rows?: { cells?: { content?: string }[] }[];
}

/** One match as Fantrax scored it, joined to FPL's history on opponent and venue, a pair unique in a league season.
 *  Fantrax's club codes disagree with FPL's on two clubs (`BRF`/`NOT`); `identity/clubCodes.ts` translates. */
export interface PlayerMatch {
  /** FANTRAX's club code for the opponent, untranslated: the join translates. */
  opponent: string;
  home: boolean;
  /** Our league's points for the match; null where Fantrax left the cell empty, never nought. */
  points: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  /** The five FPL does not publish at all. */
  shots: number | null;
  shotsOnTarget: number | null;
  foulsCommitted: number | null;
  foulsSuffered: number | null;
  offsides: number | null;
}

/** His season row as label-and-value pairs, read by position: the only table with exactly one row. */
export function seasonStats(raw: RawPlayerProfile): LabelledValue[] {
  const table = (raw.sectionContent?.OVERVIEW?.tables ?? []).find((t) => t.rows?.length === 1);
  const heads = table?.header?.cells ?? [];
  const cells = table?.rows?.[0]?.cells ?? [];
  const out: LabelledValue[] = [];
  for (let at = 0; at < heads.length; at++) {
    const label = heads[at]?.shortName ?? heads[at]?.name;
    const value = plainText(cells[at]?.content);
    if (!label || value === null) continue;
    out.push({ label, description: heads[at]?.name ?? null, value });
  }
  return out;
}

/** Fantrax's football stat ids on a per-match row (`{statId}#-1`); never `shortName`, which differs table to table. */
const MATCH = {
  opponent: "opponent",
  points: "fpts",
  minutes: "6120#-1",
  goals: "6090#-1",
  assists: "6000#-1",
  shots: "6210#-1",
  shotsOnTarget: "6230#-1",
  foulsCommitted: "6040#-1",
  foulsSuffered: "6050#-1",
  offsides: "6130#-1",
} as const;

/** His recent matches, most recent first: the only table keyed with both `opponent` and `fpts`. */
export function recentGames(raw: RawPlayerProfile): PlayerMatch[] {
  const heads = (raw.sectionContent?.OVERVIEW?.tables ?? [])
    .map((table) => ({ table, keys: (table.header?.cells ?? []).map((cell) => cell.key ?? "") }))
    .find((t) => t.keys.includes(MATCH.opponent) && t.keys.includes(MATCH.points));
  if (!heads) return [];

  const at = (key: string) => heads.keys.indexOf(key);
  const out: PlayerMatch[] = [];
  for (const row of heads.table.rows ?? []) {
    const cells = row.cells ?? [];
    const cell = (key: string) => (at(key) < 0 ? null : plainText(cells[at(key)]?.content));
    const figure = (key: string) => numeric(cell(key) ?? undefined);
    const opponent = cell(MATCH.opponent);
    if (opponent === null) continue;
    // `@HUL` away, `IPS` at home.
    const away = opponent.startsWith("@");
    out.push({
      opponent: away ? opponent.slice(1) : opponent,
      home: !away,
      points: figure(MATCH.points),
      minutes: figure(MATCH.minutes),
      goals: figure(MATCH.goals),
      assists: figure(MATCH.assists),
      shots: figure(MATCH.shots),
      shotsOnTarget: figure(MATCH.shotsOnTarget),
      foulsCommitted: figure(MATCH.foulsCommitted),
      foulsSuffered: figure(MATCH.foulsSuffered),
      offsides: figure(MATCH.offsides),
    });
  }
  return out;
}
