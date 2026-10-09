import {
  FANTRAX_LEAGUE_ID,
  type Deal,
  type DraftPick,
  type FootballSnapshot,
  type LeagueInfo,
  type LiveTeamScore,
  type PeriodPairing,
  type RosteredTeam,
  type StandingsRow,
  type Trade,
  completedTrades,
  deals,
  fetchDraftResults,
  fetchLiveScoring,
  fetchTeamRosters,
  fetchStandingsPage,
  fetchTransactions,
  mapDraftPicks,
  mapLivePlayerPoints,
  mapLiveScores,
  mapStandings,
  mapTransactions,
  periodPairings,
  wasFielded,
} from "@epl/core";
import { rosteredPeriod } from "./bridge";

// Everything the writer is allowed to know, read here at the edge so the brief
// builders stay pure. One read per surface, each caught on its own: a read we
// cannot make costs the brief a block, never the filing.

/** Everything the desk and the briefs decide from, read once per firing. */
export interface DeskFacts {
  pairings: PeriodPairing[];
  /** Each team's score this period; empty when the live read refused. */
  scores: Map<string, LiveTeamScore>;
  /** The resolved squads, for the joins only a bridge can make — who owns the
   *  men in a fixture. Empty when the rosters read refused. */
  teams: RosteredTeam[];
  /** What each man scored his owner this period, priced at the slot he was
   *  filed in — Fantrax's own number, and the only points this league has.
   *  Absent rather than nought for a man Fantrax has not priced. */
  playerPoints: Map<string, number>;
  fielded: boolean;
  business: Deal[];
  /** The season's completed trades, newest first: Here We Go files each on detection. */
  trades: Trade[];
  pedigree: Map<string, DraftPick>;
  /** Fantrax's table, verbatim, for Lawro and the draft report. Empty when the standings read refused. */
  table: StandingsRow[];
}

export async function gatherRoundFacts(
  info: LeagueInfo,
  snapshot: FootballSnapshot,
  period: number,
): Promise<DeskFacts> {
  const [live, rosters, claims, trades, draft, standingsPage] = await Promise.all([
    // Refused for a period the league never played; the scores go empty and Lawro and the Team Sheet still file.
    fetchLiveScoring(FANTRAX_LEAGUE_ID, period).catch(() => null),
    // The ROUND's period, not today's: unasked, Fantrax rolls its label the moment a round's last fixture ends, and
    // `wasFielded` read false for every column filed after a round (probed 2 Sep: a different answer, not a label).
    fetchTeamRosters(FANTRAX_LEAGUE_ID, period).catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null),
    fetchDraftResults(FANTRAX_LEAGUE_ID).catch(() => null),
    // The page, not the fxea array: it carries every column the table is drawn from, as `/league` reads it.
    fetchStandingsPage(FANTRAX_LEAGUE_ID).catch(() => null),
  ]);

  // The squads, and with them what only a join can say: whether the arrangement we hold is the one that was fielded.
  const squads = rosters === null ? null : rosteredPeriod(snapshot, rosters);
  const traded = trades === null ? [] : mapTransactions(trades, "TRADE");

  return {
    pairings: periodPairings(info.matchups, info.teams, period),
    scores: new Map((live === null ? [] : mapLiveScores(live)).map((score) => [score.teamId, score])),
    teams: squads?.teams ?? [],
    playerPoints: new Map(
      (live === null ? [] : mapLivePlayerPoints(live)).flatMap((squad) =>
        squad.players.map((player) => [player.fantraxId, player.points] as const),
      ),
    ),
    fielded: squads !== null && wasFielded(squads, period),
    business: deals([
      ...(claims === null ? [] : mapTransactions(claims, "CLAIM_DROP")),
      ...traded,
    ]),
    trades: completedTrades(traded),
    table: standingsPage === null ? [] : mapStandings(standingsPage),
    // Where each man was taken; empty before a draft, so no brief calls every squad undrafted.
    pedigree: new Map(
      (draft === null ? [] : mapDraftPicks(draft)).map((taken) => [taken.fantraxId, taken]),
    ),
  };
}
