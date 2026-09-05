import {
  FANTRAX_LEAGUE_ID,
  clubById,
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
  type TeamProjection,
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
  mapProjectedTotals,
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
import { type MatchFootball, roundFootball } from "./football";

// Everything the writer is allowed to know, read here at the edge so the brief
// builders stay pure. One read per surface, each caught on its own: a feed we
// cannot read costs the brief a block, never the filing.

/** Everything the desk decides from — every read this edition makes EXCEPT the
 *  Premier League's.
 *
 *  **Split from `RoundFacts` because the desk never looks at the football and it
 *  is three quarters of a quiet firing's network.** `newsdesk` reads `teams`,
 *  `pairings`, `business`, `news` and `scores` and nothing else
 *  (`write-edition.ts`'s `DeskState`), and about a hundred and ten firings a week
 *  end at "Nothing new to report." — each of which was paying `1 + 3 × played
 *  fixtures` requests to the Premier League and discarding every one. */
export interface DeskFacts {
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
  /** Fantrax's table, verbatim — the power rankings argue with it and nothing
   *  else reads it. Empty when the standings read refused, which costs that
   *  column and no other. */
  table: StandingsRow[];
  /** Wire items that name a man somebody in this league holds, freshest
   *  first. Triaged here so the newsdesk sees only what has a stake in it. */
  news: { item: NewsItem; affected: Affected[] }[];
}

/** The desk's facts with the football added, which is what a BRIEF sees.
 *
 *  A brief is only ever built after the desk has said there is something to
 *  write, so this type is the one every builder takes and `DeskFacts` never
 *  reaches them. */
export interface RoundFacts extends DeskFacts {
  /** What happened in each played fixture, by FPL fixture id — the minute of
   *  every goal, who assisted it, the cards and the substitutions, and a handful
   *  of each side's figures.
   *
   *  **The half the match report never had.** Its brief used to say outright
   *  that the writer did not know the order anything happened, so the column
   *  could only enumerate — and it read like a ledger because it was one.
   *  Empty when the Premier League's feed could not be read, which costs the
   *  report its spine and makes it say so. */
  football: Map<number, MatchFootball>;
}

/** The Premier League's own feed, added to the desk's facts once there is a
 *  column to write.
 *
 *  **Its own step because of what it costs and when it is worth it.** One
 *  `fetchPlRound` plus three per fixture that has kicked off — `fetchPlFixture`,
 *  `fetchPlMatchStats` and `fetchPlTextstream` — so 31 requests for a complete
 *  round, against 11 for every other read this edition makes put together. It
 *  was awaited inside `gatherRoundFacts`, three lines before a `newsdesk` that
 *  never reads it and thirty before the quiet exit, so the common firing paid all
 *  31 and threw them away.
 *
 *  And the steady state is the expensive one rather than the cheap one: FPL keeps
 *  `is_current` on a played round until the next deadline and `focusGameweek`
 *  takes `is_current` first, so every firing from Sunday night to the following
 *  Saturday re-fetched the same finished round in full.
 *
 *  Called once, at the one place a brief is about to be built. */
export async function withFootball(
  facts: DeskFacts,
  snapshot: FootballSnapshot,
): Promise<RoundFacts> {
  return {
    ...facts,
    football: await roundFootball(snapshot.gameweek, snapshot, clubById(snapshot)),
  };
}

export async function gatherRoundFacts(
  info: LeagueInfo,
  snapshot: FootballSnapshot,
  period: number,
): Promise<DeskFacts> {
  const [live, rosters, claims, trades, draft, standingsPage, wire] = await Promise.all([
    fetchLiveScoring(FANTRAX_LEAGUE_ID, period),
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
    table: standingsPage === null ? [] : mapStandings(standingsPage),
    news:
      wire === null || squads === null
        ? []
        : mapNews(wire)
            .map((item) => ({ item, affected: affectedBy(item, squads.teams) }))
            // An item about nobody we hold is not our story, and filing it
            // would be the paper reprinting the BBC.
            .filter((story) => story.affected.length > 0),
    pedigree: new Map(
      (draft === null ? [] : mapDraftPicks(draft)).map((taken) => [taken.fantraxId, taken]),
    ),
  };
}
