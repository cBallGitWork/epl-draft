import {
  FANTRAX_LEAGUE_ID,
  fetchTransactions,
  goingIn,
  mapTransactions,
  meetingLines,
  periodPairings,
  gameweekForm,
  seasonForm,
  tableAfter,
  tableBefore,
  tableMoves,
  tablePoints,
  type Cutoff,
  type DraftPick,
  type FormGame,
  type FormerSide,
  type LeagueInfo,
  type MatchupState,
  type PeriodResult,
  type SeasonFact,
  type StandingsRow,
  type TablePlace,
} from "@epl/core";

// The season around one gameweek, for the draft report's form and table (Craig, 29 Sep 2026, and the FM panel): each
// side's settled results before the gameweek, the table rebuilt from them, the meetings of any two sides, and where a man
// used to be. Read once; the gameweek's facts are then worked from it at each cut-off.

export interface DraftSeason {
  period: number;
  /** Each side's settled results before this gameweek, oldest first. */
  runs: Map<string, FormGame[]>;
  /** The table before this gameweek, or null when what a result is worth cannot be read. */
  table: StandingsRow[] | null;
  results: readonly PeriodResult[];
  info: LeagueInfo;
  /** Where each man has been: the side that drafted him, traded him or released him. */
  formerly: Map<string, FormerSide[]>;
}

export async function draftSeason(info: LeagueInfo, table: readonly StandingsRow[], results: readonly PeriodResult[], pedigree: ReadonlyMap<string, DraftPick>, period: number): Promise<DraftSeason> {
  const runs = new Map(seasonForm(table, info.matchups, results).map((f) => [f.teamId, f.run.filter((g) => g.period < period)]));
  const pay = tablePoints(table);
  const formerly = new Map<string, FormerSide[]>();
  const add = (id: string, side: FormerSide) => formerly.set(id, [...(formerly.get(id) ?? []), side]);
  for (const [id, pick] of pedigree) add(id, { teamId: pick.teamId, how: "drafted", when: pick.round });
  const [claims, trades] = await Promise.all([fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null), fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null)]);
  const moves = [...(claims === null ? [] : mapTransactions(claims, "CLAIM_DROP")), ...(trades === null ? [] : mapTransactions(trades, "TRADE"))];
  for (const t of moves) {
    if (t.fromTeamId === null || t.period === null || t.period >= period || !t.executed) continue;
    if (t.kind === "trade") add(t.fantraxId, { teamId: t.fromTeamId, how: "traded", when: t.period });
    if (t.kind === "drop") add(t.fantraxId, { teamId: t.fromTeamId, how: "released", when: t.period });
  }
  return { period, runs, table: pay === null ? null : tableBefore(table, runs, period, pay), results, info, formerly };
}

/** A side's place and record before the gameweek, with its last five results. */
export function placeOf(season: DraftSeason, teamId: string): TablePlace | null {
  const row = season.table?.find((r) => r.teamId === teamId);
  const run = (season.runs.get(teamId) ?? []).slice(-5);
  return row === undefined ? null : { rank: row.rank, won: row.won, drawn: row.drawn, lost: row.lost, run: run.map((g) => g.result).join("") };
}

/** Two sides' earlier meetings, from the home side's view. */
export function meetingsOf(season: DraftSeason, home: { teamId: string; name: string }, away: { teamId: string; name: string }): string[] {
  const scored = (p: number, teamId: string) => season.results.find((r) => r.period === p && r.teamId === teamId)?.points;
  const met = [];
  for (let p = 1; p < season.period; p++) {
    const pairing = periodPairings(season.info.matchups, season.info.teams, p).find((x) => [x.home.teamId, x.away.teamId].sort().join() === [home.teamId, away.teamId].sort().join());
    const [h, a] = [scored(p, home.teamId), scored(p, away.teamId)];
    if (pairing !== undefined && typeof h === "number" && typeof a === "number") met.push({ period: p, for: h, against: a });
  }
  return meetingLines(home.name, away.name, met);
}

/** Each side's form and table facts at the cut-off: after Saturday, the runs going in; at the end, the gameweek's results
 *  (with the substitutions) against the season, and the table after them. */
export function gameweekFacts(season: DraftSeason, states: readonly MatchupState[], cutoff: Cutoff): Map<string, SeasonFact[]> {
  const out = new Map<string, SeasonFact[]>();
  const add = (teamId: string, fact: SeasonFact) => out.set(teamId, [...(out.get(teamId) ?? []), fact]);
  const sides = states.flatMap((s) => [s.home, s.away]);
  if (cutoff === "saturday") {
    for (const s of sides) {
      const fact = goingIn(s.side.teamId, s.side.name, season.runs.get(s.side.teamId) ?? []);
      if (fact !== null) add(s.side.teamId, fact);
    }
    return out;
  }
  const results = states.flatMap((s) => [
    { teamId: s.home.side.teamId, name: s.home.side.name, opponent: s.away.side.name, for: s.home.total, against: s.away.total },
    { teamId: s.away.side.teamId, name: s.away.side.name, opponent: s.home.side.name, for: s.away.total, against: s.home.total },
  ]);
  for (const fact of gameweekForm(results, season.runs)) add(fact.teamId, fact);
  const after = season.table === null ? null : tableAfter(season.table, results);
  if (season.table !== null && after !== null) for (const fact of tableMoves(season.table, after)) add(fact.teamId, fact);
  return out;
}
