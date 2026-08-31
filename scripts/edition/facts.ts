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
  type TeamOfTheWeek,
  type TeamProjection,
  availability,
  deals,
  fetchDraftResults,
  fetchLiveScoring,
  fetchTeamRosters,
  fetchTransactions,
  mapDraftPicks,
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedTotals,
  mapTeamRosters,
  mapTransactions,
  periodPairings,
  resolveRosters,
  teamOfTheWeek,
  wasFielded,
} from "@epl/core";
import mapping from "../../data/mappings/fantrax.json";

// Everything the writer is allowed to know, read here at the edge so the brief
// builders stay pure. One read per surface, each caught on its own: a feed we
// cannot read costs the brief a block, never the filing.

export interface RoundFacts {
  pairings: PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  projected: Map<string, TeamProjection>;
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
}

export async function gatherRoundFacts(
  info: LeagueInfo,
  snapshot: FootballSnapshot,
  period: number,
): Promise<RoundFacts> {
  const [live, rosters, claims, trades, draft] = await Promise.all([
    fetchLiveScoring(FANTRAX_LEAGUE_ID, period),
    fetchTeamRosters(FANTRAX_LEAGUE_ID).catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "CLAIM_DROP").catch(() => null),
    fetchTransactions(FANTRAX_LEAGUE_ID, "TRADE").catch(() => null),
    fetchDraftResults(FANTRAX_LEAGUE_ID).catch(() => null),
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
  const eleven = squads === null ? null : teamOfTheWeek(squads.teams, info.roster);

  return {
    pairings: periodPairings(info.matchups, info.teams, period),
    scores: new Map(mapLiveScores(live).map((score) => [score.teamId, score])),
    projected: new Map(mapProjectedTotals(live).map((guess) => [guess.teamId, guess])),
    teams: squads?.teams ?? [],
    playerPoints: new Map(
      mapLivePlayerPoints(live).flatMap((squad) =>
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
    // Where each man was taken. Empty until a draft completes, which is the real
    // league's state until 10 Oct — and an empty map means the brief says
    // nothing about pedigree rather than calling every squad undrafted.
    pedigree: new Map(
      (draft === null ? [] : mapDraftPicks(draft)).map((taken) => [taken.fantraxId, taken]),
    ),
  };
}
