import {
  FANTRAX_LEAGUE_ID,
  type AvailabilityNote,
  type Bridge,
  type Deal,
  type DraftPick,
  type FootballSnapshot,
  type LeagueInfo,
  type LiveTeamScore,
  type PeriodPairing,
  type RosteredTeam,
  type StandingsRow,
  type TeamOfTheWeek,
  availability,
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
  mapTeamRosters,
  mapTransactions,
  periodPairings,
  resolveRosters,
  teamOfTheWeek,
  wasFielded,
} from "@epl/core";
import { BBC_FOOTBALL, affectedBy, fetchFeed, mapNews, type Affected, type NewsItem } from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";

// Everything the writer is allowed to know, read here at the edge so the brief
// builders stay pure. One read per surface, each caught on its own: a feed we
// cannot read costs the brief a block, never the filing.

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
  eleven: TeamOfTheWeek | null;
  fielded: boolean;
  business: Deal[];
  doubts: AvailabilityNote[];
  pedigree: Map<string, DraftPick>;
  /** Fantrax's table, verbatim — the power rankings argue with it and nothing
   *  else reads it. Empty when the standings read refused, which costs that
   *  column and no other. */
  table: StandingsRow[];
  /** Wire items that name a man somebody in this league holds, freshest
   *  first. Triaged here so the newsdesk sees only what has a stake in it. */
  news: { item: NewsItem; affected: Affected[] }[];
}

export async function gatherRoundFacts(
  info: LeagueInfo,
  snapshot: FootballSnapshot,
  period: number,
): Promise<DeskFacts> {
  const [live, rosters, claims, trades, draft, standingsPage, wire] = await Promise.all([
    // Refused for a period the league never played; the scores go empty and Lawro and the Team Sheet still file.
    fetchLiveScoring(FANTRAX_LEAGUE_ID, period).catch(() => null),
    // **The ROUND's period, not today's.** Asked without one, Fantrax answers
    // with whatever it currently labels the rosters — and it rolls that label
    // the moment a round's last fixture ends, so for about four days in seven
    // it names next week. Every other read here already asks for the round's
    // period; this one did not, which made `wasFielded` false for every column
    // that fires AFTER a round finishes, which is all of them. `eleven` and
    // `dodgers` could therefore never file at all.
    //
    // Probed 2 Sep 2026 (rehearsal league): the period asked for is echoed back
    // verbatim, and 3 of 10 teams field a genuinely different side in period 2
    // than in period 3 — so this is a different answer, not a different label.
    fetchTeamRosters(FANTRAX_LEAGUE_ID, period).catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null),
    fetchDraftResults(FANTRAX_LEAGUE_ID).catch(() => null),
    // The page and not the fxea array: the page carries every column the table
    // is drawn from. The array was read alongside it for `gamesBack` alone, and
    // that column went when the table became a football one on 31 Aug — the
    // same single read `/league` now makes, for the same reason.
    fetchStandingsPage(FANTRAX_LEAGUE_ID).catch(() => null),
    // The wire is the one read that is nobody's provider: a feed we cannot
    // fetch costs the paper its news section and nothing else.
    fetchFeed(BBC_FOOTBALL).catch(() => null),
  ]);

  // The squads, and with them the two things only a join can say: who was in the
  // week's eleven, and whether the arrangement we hold is the one that was
  // actually fielded.
  // `as Bridge` and not a looser cast: a JSON import widens `matchedBy` to
  // `string` and the compiler cannot see that the writer only emits four
  // literals. Asserted exactly as `apps/companion/app/squads.ts` asserts it, and
  // for the same reason.
  const squads =
    rosters === null ? null : resolveRosters(snapshot, mapTeamRosters(rosters), mapping as Bridge);
  const eleven = squads === null ? null : teamOfTheWeek(squads.teams, info.roster, new Map());

  return {
    pairings: periodPairings(info.matchups, info.teams, period),
    scores: new Map((live === null ? [] : mapLiveScores(live)).map((score) => [score.teamId, score])),
    teams: squads?.teams ?? [],
    playerPoints: new Map(
      (live === null ? [] : mapLivePlayerPoints(live)).flatMap((squad) =>
        squad.players.map((player) => [player.fantraxId, player.points] as const),
      ),
    ),
    eleven: eleven !== null && eleven.picks.length > 0 ? eleven : null,
    fielded: squads !== null && wasFielded(squads, period),
    business: deals([
      ...(claims === null ? [] : mapTransactions(claims, "CLAIM_DROP")),
      ...(trades === null ? [] : mapTransactions(trades, "TRADE")),
    ]),
    doubts: squads === null ? [] : availability(squads.teams),
    table: standingsPage === null ? [] : mapStandings(standingsPage),
    news:
      wire === null || squads === null
        ? []
        : mapNews(wire)
            .map((item) => ({ item, affected: affectedBy(item, squads.teams) }))
            // An item about nobody we hold is not our story, and filing it
            // would be the paper reprinting the BBC.
            .filter((story) => story.affected.length > 0),
    // Where each man was taken; empty before a draft, so no brief calls every squad undrafted.
    pedigree: new Map(
      (draft === null ? [] : mapDraftPicks(draft)).map((taken) => [taken.fantraxId, taken]),
    ),
  };
}
