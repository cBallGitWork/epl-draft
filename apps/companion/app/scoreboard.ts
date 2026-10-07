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
  type ScoringCategory,
  type ScoringRules,
  fetchLiveScoring,
  liveBreakdown,
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveScores,
  pendingCleanSheets,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal, tell } from "./refusals";

// The head-to-head board's reads and joins, kept out of the page.

/** Fantrax's totals for this period, with the refusal carried: a dash alone cannot say the
 *  scoreboard is down. */
const readScores = leagueCache("live-scores",
  async (period: number): Promise<{
    scores: [string, LiveTeamScore][];
    /** Per team, the men Fantrax has priced this period. From the same payload
     *  as the totals above, mapped a second time rather than fetched again. */
    players: [string, LivePlayerPoints[]][];
    /** Per team, the reserves Fantrax priced, which count in no total. */
    bench: [string, LivePlayerPoints[]][];
    refused: string | null;
  }> => {
    const raw = await orRefusal(fetchLiveScoring(FANTRAX_LEAGUE_ID, period));
    if (raw instanceof FantraxError) {
      return { scores: [], players: [], bench: [], refused: tell(raw) };
    }
    return {
      scores: mapLiveScores(raw).map((score) => [score.teamId, score]),
      players: mapLivePlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      bench: mapBenchPlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      refused: null,
    };
  },
  (error) => ({ scores: [], players: [], bench: [], refused: tell(error) }),
);

export async function liveScores(
  period: number,
): Promise<{ scores: Map<string, LiveTeamScore>; refused: string | null }> {
  // A Map does not survive the cache, so entries cross it and the Map is built out here.
  const { scores, refused } = await readScores(period);
  return { scores: new Map(scores), refused };
}

/** Every man Fantrax priced this period, eleven and reserves, by Fantrax id; empty when it refused. */
export async function periodPoints(period: number): Promise<Map<string, number>> {
  const { players, bench } = await readScores(period);
  return new Map([...players, ...bench].flatMap(([, squad]) => squad.map((man) => [man.fantraxId, man.points])));
}

/** One squad's points at each man's slot, filtered outside the shared cache and asked only behind
 *  the lineup gate, since the section a man is priced in reveals the eleven. `counted` is the
 *  eleven alone and makes the scoreline; the rest include reserves. Null when Fantrax refused. */
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

/** The clean sheets Fantrax has not credited yet, per team. Empty without the league's scoring, and
 *  while the lineup gate is shut: a `+4` beside a squad says a defender is in the eleven. */
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
