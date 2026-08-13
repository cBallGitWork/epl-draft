import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  PAGE_REVALIDATE,
  FantraxError,
  type FootballSnapshot,
  type LiveTeamScore,
  type PendingCleanSheets,
  type RosterDisplay,
  type RosteredTeam,
  type ScoringRules,
  fetchLiveScoring,
  mapLiveScores,
  pendingCleanSheets,
} from "@epl/core";
import { orRefusal, tell } from "../../refusals";

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
const readScores = unstable_cache(
  async (period: number): Promise<{ scores: [string, LiveTeamScore][]; refused: string | null }> => {
    const raw = await orRefusal(fetchLiveScoring(FANTRAX_LEAGUE_ID, period));
    if (raw instanceof FantraxError) return { scores: [], refused: tell(raw) };
    return { scores: mapLiveScores(raw).map((score) => [score.teamId, score]), refused: null };
  },
  ["live-scores", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

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
