import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type BreakdownLine,
  type FootballSnapshot,
  type LivePlayerPoints,
  type LiveTeamScore,
  type PendingCleanSheets,
  type RosterDisplay,
  type RosteredTeam,
  type PlayerProjection,
  type ScoringCategory,
  type ScoringRules,
  fetchLiveScoring,
  liveBreakdown,
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedPlayerPoints,
  pendingCleanSheets,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal, tell } from "./refusals";

// What the head-to-head board is made of, kept out of the page for the same
// reason `squad/league.ts` and `players/pool.ts` are: the reads and the joins
// have their own reasons to be the way they are, and a route file should be
// about what appears on screen.

/** Fantrax's totals for this period, and the refusal if there was one.
 *
 *  Failure-tolerant on purpose: a scoreboard we cannot read costs the numbers,
 *  not the page. Who plays whom comes from a different read and is still worth
 *  showing on its own.
 *
 *  The refusal is carried rather than swallowed. A missing total already renders
 *  as a dash in healthy reads — a team Fantrax has no number for — so dashes
 *  alone cannot say "the scoreboard is down", and a page claiming to show
 *  Fantrax's points while showing none of them is the confident wrong answer
 *  principle 4 forbids. */
const readScores = leagueCache("live-scores",
  async (period: number): Promise<{
    scores: [string, LiveTeamScore][];
    /** Per team, the men Fantrax has priced this period. From the same payload
     *  as the totals above, mapped a second time rather than fetched again. */
    players: [string, LivePlayerPoints[]][];
    /** Per team, the reserves Fantrax priced, which count in no total. */
    bench: [string, LivePlayerPoints[]][];
    /** Per team, what Fantrax GUESSES those men will do. A third read of the same
     *  payload, and a different claim from the one above it: that one is what has
     *  happened, this one is what they think will. */
    projected: [string, PlayerProjection[]][];
    refused: string | null;
  }> => {
    const raw = await orRefusal(fetchLiveScoring(FANTRAX_LEAGUE_ID, period));
    if (raw instanceof FantraxError) {
      return { scores: [], players: [], bench: [], projected: [], refused: tell(raw) };
    }
    return {
      scores: mapLiveScores(raw).map((score) => [score.teamId, score]),
      players: mapLivePlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      bench: mapBenchPlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      projected: mapProjectedPlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      refused: null,
    };
  },
);

/** Fantrax's own guess at one man this period, out of the payload the scoreboard
 *  already holds.
 *
 *  **Never a score, and never printed in a column headed `FPts`** — that is
 *  Fantrax's word for what a player HAS scored, and this is the other one.
 *
 *  **Asked behind the lineup gate, exactly as `squadLivePoints` is.** Fantrax
 *  projects the ACTIVE section and nothing else, so a number here says the man is
 *  in his manager's eleven — the one fact the gate withholds before a deadline.
 *  The caller does the gating, because only the caller knows who is asking.
 *
 *  Null for a refusal and for a man they have not guessed about; both are a dash,
 *  and neither is nought.
 *
 *  Filtered to one team out here rather than inside the cache, on the rule
 *  `leagueCache` exists to keep: nothing about who is asking may cross into a
 *  cached read. */
export async function playerProjection(
  period: number,
  teamId: string,
  fantraxId: string,
): Promise<number | null> {
  const { projected, refused } = await readScores(period);
  if (refused !== null) return null;

  const squad = projected.find(([id]) => id === teamId)?.[1] ?? [];
  return squad.find((player) => player.fantraxId === fantraxId)?.points ?? null;
}

export async function liveScores(
  period: number,
): Promise<{ scores: Map<string, LiveTeamScore>; refused: string | null }> {
  // Cached because this is the read sixteen phones poll every thirty seconds on
  // a Saturday — by some distance the most frequent request the app makes. A Map
  // does not survive the cache round trip, so entries go in and the Map is built
  // out here.
  const { scores, refused } = await readScores(period);
  return { scores: new Map(scores), refused };
}

/** One squad's points this period, priced at the slot each man is filling.
 *
 *  **Filtered to one team out here, never inside the cache.** The cached read is
 *  the whole league's and is keyed only by league and period — nothing about who
 *  is asking may cross into it, which is the rule `leagueCache` exists to keep.
 *
 *  **And it is only ever called for a side whose eleven is already on screen.**
 *  Which section a man is priced in says whether he is in the eleven, the exact
 *  fact the gate withholds before a deadline, so this is asked behind the gate.
 *
 *  `points` and `breakdown` hold every man Fantrax priced, reserves included, for
 *  drawing; `counted` is the eleven alone, and is what adds up to the scoreline.
 *  Null when Fantrax refused; a man with no entry has not played. */
export async function squadLivePoints(
  period: number,
  teamId: string,
  categories: Record<string, ScoringCategory>,
): Promise<{
  points: Map<string, number | null>;
  breakdown: Record<string, BreakdownLine[]>;
  counted: Record<string, BreakdownLine[]>;
  /** Every count Fantrax stated for each man, noughts included, by the league's category code. */
  counts: Record<string, Record<string, string>>;
} | null> {
  const { players, bench, refused } = await readScores(period);
  if (refused !== null) return null;

  const eleven = players.find(([id]) => id === teamId)?.[1] ?? [];
  const reserves = bench.find(([id]) => id === teamId)?.[1] ?? [];
  const lines = (squad: LivePlayerPoints[]) =>
    Object.fromEntries(
      squad.map((player) => [player.fantraxId, liveBreakdown(player.categories, categories)]),
    );
  const counted = lines(eleven);
  return {
    points: new Map<string, number | null>(
      [...eleven, ...reserves].map((player) => [player.fantraxId, player.points]),
    ),
    breakdown: { ...counted, ...lines(reserves) },
    counted,
    counts: Object.fromEntries(
      [...eleven, ...reserves].map((player) => [
        player.fantraxId,
        Object.fromEntries(
          player.counts.flatMap(({ category, value }) => {
            const code = categories[category]?.code;
            return code === undefined || value === null ? [] : [[code, value]];
          }),
        ),
      ]),
    ),
  };
}

/** The clean sheets Fantrax has not credited yet, per team.
 *
 *  Empty when the league did not describe its scoring: a preview we cannot price
 *  is one we do not show, rather than one we guess at.
 *
 *  Empty too while the lineup gate is shut, and that is the load-bearing one.
 *  Only active players are owed a clean sheet, so a green `+4` beside a squad
 *  says a defender is in the eleven — the exact fact the gate exists to withhold
 *  before a deadline. The gate is normally open whenever a fixture is in play,
 *  but not when Fantrax has failed to say which period it is, and a leak in the
 *  case where we are least sure is the one that cannot be taken back. */
export function pendingByTeam(
  teams: readonly RosteredTeam[],
  rules: ScoringRules | null,
  snapshot: FootballSnapshot,
  display: RosterDisplay,
): Map<string, PendingCleanSheets> {
  if (display.show !== "lineup" || rules === null) return new Map();

  const inPlay = new Set(
    snapshot.fixtures.filter((fixture) => fixture.status === "live").map((fixture) => fixture.id),
  );
  if (inPlay.size === 0) return new Map();

  return new Map(teams.map((team) => [team.teamId, pendingCleanSheets(team, rules, inPlay)]));
}
