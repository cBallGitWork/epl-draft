import { text } from "./profile";
import type { LabelledValue, RawLabelled, RawPlayerProfile } from "./profile";

// The half of `getPlayerProfile` that arrives as TABLES, read apart from the half
// that arrives as labelled pairs.
//
// Two files because `profile.ts` crossed CODE_RULES §4's 300-line ceiling and
// because the two halves are read by different rules. `miscData` is name-and-value
// pairs and is read BY NAME. `sectionContent` is tables whose columns are
// identified by numeric stat ids and whose display labels are free to move, so it
// is read BY KEY and, where there is no key, by POSITION.
//
// **Three things the payload does that nothing else in this adapter does.**
//
//  1. **Cells carry HTML.** `Fri Aug 28 -<br/>Thu Sep 3` and `<b>D</b>: 2` are
//     real cell contents. Nothing leaves this file with a tag in it.
//  2. **The endpoint does not check the sport.** An id belonging to another sport
//     answers with a complete NFL profile under our league id — `Sk`, `FF`,
//     `IntYd`. The ids below are football's and a wrong id renders wrong labels
//     rather than wrong numbers under right ones.
//  3. **The tables are found by shape and by key, never by caption.** A caption
//     is a season string we would have to build to match, and this payload has
//     already been caught serving a season other than the one asked for.

export interface RawTable {
  caption?: string;
  header?: { cells?: (RawLabelled & { key?: string })[] };
  rows?: { cells?: { content?: string }[] }[];
}

/** One match, as Fantrax scored it.
 *
 *  **Joined to FPL's own history on the opponent and the venue**, which is a safe
 *  key in a league season: a man plays each opponent once at home and once away,
 *  so the pair identifies the match without a date. Fantrax gives the venue by
 *  prefixing an away opponent with `@` — `IPS` at home, `@HUL` away — and gives
 *  its club codes in its own vocabulary, which disagrees with FPL's on two clubs
 *  (`BRF`/`NOT`). The join has to translate; `identity/clubCodes.ts` is where. */
export interface PlayerMatch {
  /** FANTRAX's club code for the opponent, theirs and untranslated. Whoever
   *  joins on it translates, because this file is the adapter and not the join. */
  opponent: string;
  home: boolean;
  /** Our league's points for the match. Null is a real answer: a cell Fantrax
   *  left empty is not a nought. */
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

/** His season row, as label-and-value pairs.
 *
 *  **The table is found by shape, never by its caption.** The caption is
 *  `"2026-27 Stats"` — a season string we would have to build to match, and the
 *  payload has already been caught serving a season other than the one asked
 *  for. What identifies it instead is that it is the only table with exactly one
 *  row: `Recent Games`, `Recent Trends`, `Upcoming Games` and `Games per
 *  Position` all carry several.
 *
 *  **And never assume it is football.** `getPlayerProfile` does not check the
 *  sport: an id from another sport answers with a complete NFL profile under our
 *  league id, sacks and interceptions and all. Nothing here reads a stat by name,
 *  so a wrong id renders wrong labels rather than wrong numbers under right ones. */
export function seasonStats(raw: RawPlayerProfile): LabelledValue[] {
  const table = (raw.sectionContent?.OVERVIEW?.tables ?? []).find((t) => t.rows?.length === 1);
  const heads = table?.header?.cells ?? [];
  const cells = table?.rows?.[0]?.cells ?? [];
  const out: LabelledValue[] = [];
  for (let at = 0; at < heads.length; at++) {
    const label = heads[at]?.shortName ?? heads[at]?.name;
    const value = stripTags(cells[at]?.content);
    if (!label || value === null) continue;
    out.push({ label, description: heads[at]?.name ?? null, value });
  }
  return out;
}

/** Fantrax's stat ids on a per-match row.
 *
 *  **Ids, not display labels.** The header carries both, and the ids are the
 *  stable half: `opponent` and `fpts` are named outright, and a statistic is
 *  `{statId}#-1`. Binding to `shortName` would bind to the word "Opp", which is
 *  a label Fantrax is free to change and which is `Opponent` on the very next
 *  table. `6210` is shots; `raw.ts`'s note on the sport applies — these ids are
 *  football's, and this endpoint will answer with another sport's if asked. */
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

/** His recent matches, most recent first, as Fantrax gives them.
 *
 *  The table is found by its KEYS rather than by its caption: "Recent Games" is
 *  a display string, and the payload has five tables of which only this one
 *  carries both `opponent` and `fpts`. `Upcoming Games` names its column `opp`
 *  and `Recent Trends` prefixes every id with `5010#`, so neither collides. */
export function recentGames(raw: RawPlayerProfile): PlayerMatch[] {
  const heads = (raw.sectionContent?.OVERVIEW?.tables ?? [])
    .map((table) => ({ table, keys: (table.header?.cells ?? []).map((cell) => cell.key ?? "") }))
    .find((t) => t.keys.includes(MATCH.opponent) && t.keys.includes(MATCH.points));
  if (!heads) return [];

  const at = (key: string) => heads.keys.indexOf(key);
  const out: PlayerMatch[] = [];
  for (const row of heads.table.rows ?? []) {
    const cells = row.cells ?? [];
    const cell = (key: string) => (at(key) < 0 ? null : stripTags(cells[at(key)]?.content));
    const figure = (key: string) => {
      const value = cell(key);
      if (value === null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const opponent = cell(MATCH.opponent);
    if (opponent === null) continue;
    // `@HUL` away, `IPS` at home. The marker is Fantrax's and this is where it
    // stops being a string.
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

/** Provider text as text. Tags out, entities left alone — they are rendered as
 *  a string by React, which escapes them itself. */
function stripTags(value: string | undefined): string | null {
  return text(value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

// **`latestNews` is deliberately not read, and it was for one commit.** This
// section carries one truncated sentence — elided with an ellipsis by Fantrax —
// beside `analysisTitle: "Analysis available to registered users"`. The SAME
// story arrives on `getPlayerNews` with its full body, its full analysis and a
// real timestamp, unauthenticated, for the whole pool in one read. A headline is
// not worth a field when the report is free; `playerNews.ts` is where it lives.
