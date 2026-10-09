import {
  FANTRAX_LEAGUE_ID,
  fetchTransactions,
  goingIn,
  mapTransactions,
  meetingsWon,
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

interface DraftSeason {
  period: number;
  /** Each side's settled results before this gameweek, oldest first. */
  runs: Map<string, FormGame[]>;
  /** The table before this gameweek, or null when the results or what a result is worth cannot be read. */
  table: StandingsRow[] | null;
  /** Null when Fantrax would not give them: no place, form, table or meeting is told. */
  results: readonly PeriodResult[] | null;
  info: LeagueInfo;
  /** Where each man has been: the side that drafted him, traded him or released him. */
  formerly: Map<string, FormerSide[]>;
  /** The men who came to a side for this gameweek, by fantraxId: a claim or a trade taking effect in its period. */
  arrivals: Map<string, { teamId: string; how: "claim" | "trade" }>;
}

export async function draftSeason(info: LeagueInfo, table: readonly StandingsRow[], results: readonly PeriodResult[] | null, pedigree: ReadonlyMap<string, DraftPick>, period: number): Promise<DraftSeason> {
  const runs = new Map(seasonForm(table, info.matchups, results ?? []).map((f) => [f.teamId, f.run.filter((g) => g.period < period)]));
  const pay = results === null ? null : tablePoints(table);
  const formerly = new Map<string, FormerSide[]>();
  const add = (id: string, side: FormerSide) => formerly.set(id, [...(formerly.get(id) ?? []), side]);
  for (const [id, pick] of pedigree) add(id, { teamId: pick.teamId, how: "drafted", when: pick.round });
  const [claims, trades] = await Promise.all([fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null), fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null)]);
  const moves = [...(claims === null ? [] : mapTransactions(claims, "CLAIM_DROP")), ...(trades === null ? [] : mapTransactions(trades, "TRADE"))];
  const arrivals = new Map<string, { teamId: string; how: "claim" | "trade" }>();
  for (const t of moves) {
    if ((t.kind === "claim" || t.kind === "trade") && t.executed && t.period === period && t.toTeamId !== null) arrivals.set(t.fantraxId, { teamId: t.toTeamId, how: t.kind });
    if (t.fromTeamId === null || t.period === null || t.period >= period || !t.executed) continue;
    if (t.kind === "trade") add(t.fantraxId, { teamId: t.fromTeamId, how: "traded", when: t.period });
    if (t.kind === "drop") add(t.fantraxId, { teamId: t.fromTeamId, how: "released", when: t.period });
  }
  return { period, runs, table: pay === null ? null : tableBefore(table, runs, period, pay), results, info, formerly, arrivals };
}

/** A side's place and record before the gameweek, with its last five results. */
export function placeOf(season: DraftSeason, teamId: string): TablePlace | null {
  const row = season.table?.find((r) => r.teamId === teamId);
  const run = (season.runs.get(teamId) ?? []).slice(-5);
  return row === undefined ? null : { rank: row.rank, won: row.won, drawn: row.drawn, lost: row.lost, run: run.map((g) => g.result).join("") };
}

/** Two sides' meetings, from the home side's view, as a clean sweep's season fact when one side won them all; `now` is
 *  this gameweek's result once it is settled. */
export function sweepOf(season: DraftSeason, home: { teamId: string; name: string }, away: { teamId: string; name: string }, now: { for: number; against: number } | null): SeasonFact | null {
  const results = season.results;
  if (results === null) return null;
  const scored = (p: number, teamId: string) => results.find((r) => r.period === p && r.teamId === teamId)?.points;
  const met = [];
  for (let p = 1; p < season.period; p++) {
    const pairing = periodPairings(season.info.matchups, season.info.teams, p).find((x) => [x.home.teamId, x.away.teamId].sort().join() === [home.teamId, away.teamId].sort().join());
    const [h, a] = [scored(p, home.teamId), scored(p, away.teamId)];
    if (pairing !== undefined && typeof h === "number" && typeof a === "number") met.push({ period: p, for: h, against: a });
  }
  return meetingsWon(home, away, now === null ? met : [...met, { period: season.period, ...now }]);
}

/** The sides' results in the gameweek, with the substitutions, from each side's point of view. */
function resultsOf(states: readonly MatchupState[]) {
  return states.flatMap((s) => [
    { teamId: s.home.side.teamId, name: s.home.side.name, opponent: s.away.side.name, for: s.home.total, against: s.away.total },
    { teamId: s.away.side.teamId, name: s.away.side.name, opponent: s.home.side.name, for: s.away.total, against: s.home.total },
  ]);
}

/** Each side's place once the gameweek is added; empty when the table cannot be rebuilt. */
export function ranksAfter(season: DraftSeason, states: readonly MatchupState[]): Map<string, number> {
  const after = season.table === null ? null : tableAfter(season.table, resultsOf(states));
  return new Map((after ?? []).map((row) => [row.teamId, row.rank]));
}

/** Each side's form and table facts at the cut-off: after Saturday, the runs going in; at the end, the gameweek's results
 *  (with the substitutions) against the season, and the table after them. */
export function gameweekFacts(season: DraftSeason, states: readonly MatchupState[], cutoff: Cutoff): Map<string, SeasonFact[]> {
  const out = new Map<string, SeasonFact[]>();
  if (season.results === null) return out;
  const add = (teamId: string, fact: SeasonFact) => out.set(teamId, [...(out.get(teamId) ?? []), fact]);
  const sides = states.flatMap((s) => [s.home, s.away]);
  if (cutoff === "saturday") {
    for (const s of sides) {
      const fact = goingIn(s.side.teamId, s.side.name, season.runs.get(s.side.teamId) ?? []);
      if (fact !== null) add(s.side.teamId, fact);
    }
    return out;
  }
  const results = resultsOf(states);
  for (const fact of gameweekForm(results, season.runs)) add(fact.teamId, fact);
  const after = season.table === null ? null : tableAfter(season.table, results);
  if (season.table !== null && after !== null) for (const fact of tableMoves(season.table, after)) add(fact.teamId, fact);
  return out;
}
