import type { LivePlayerPoints, LiveSquadPoints, LiveTeamScore, TeamProjection } from "../points";

// Fantrax's live scoring: cookieless, typed, every team in one call (`matchupId` filters nothing); their points, not ours.

/** The wire, mirrored including the parts we decline to read. */
export interface RawLiveScoring {
  /** Fantrax's "the round is over". Not read: the football layer answers it from FPL. */
  allEventsFinished?: boolean;
  statsPerTeam?: {
    allTeamsStats?: Record<string, RawTeamSections | undefined>;
    /** True when `allTeamsStats` is partial; never read, as every payload seen says false.
     *  It and `refresh` sit inside `statsPerTeam`, not at the root. */
    delta?: boolean;
    refresh?: boolean;
  };
}

/** Only `ACTIVE` scores; `BENCH` arrives only with `playerViewType: "2"`, priced alike and counted in no total. */
export interface RawTeamSections {
  ACTIVE?: RawTeamSection;
  BENCH?: RawTeamSection;
}

export interface RawTeamSection {
  totalFpts?: number;
  /** Fraction of each player's fixture still to play, keyed by `fantraxId`; 1 before kickoff. */
  remainingEventPercent?: Record<string, number | undefined>;
  /** Fantrax's per-player projection for the period, omitted where none; keyed and subtotalled as `statsMap` is. */
  projectedTotalsMap?: Record<string, number | undefined>;
  /** Not read. `[0]` played, match over · `[1]` playing · `[2]` to come · `[3]` `[0]`×90, nominal · `[4]` `[2]`×90 plus
   *  minutes left in live matches. `[0]+[1]+[2]` falls short of eleven by the men whose match ended without them. */
  playerGameInfo?: number[];
  /** `"{OPP}~{kickoffEpochMs}|{gameId}|{state}"`, then `"COV 0 @ ARS 3 F|{gameId}|{state}"` once under way; state 1
   *  upcoming, 2 in progress, 3 finished. Not read: fixtures and scores come from the football layer. */
  gameStatusMap?: Record<string, string | undefined>;
  /** Per player, his period total (`object1`) and category rows (`object2`) at the ROSTER SLOT: the only per-player
   *  figure that sums to Fantrax's total. Keyed by `fantraxId`, empty until a man plays (a missing key is not nought).
   *  `_5010` and `_5020` are outfield and goalie subtotals, not players: reading them as men doubles the score. */
  statsMap?: Record<string, RawPlayerStats | undefined>;
  /** Empty on every section seen, a full live matchday included. */
  statsMap2?: Record<string, unknown | undefined>;
  /** The projection with finished matches replaced by actual scores. Not read: a preview is judged on the pre-game guess. */
  calculatedProjectedTotalsMap?: Record<string, number | undefined>;
  projectedTotalsMap2?: Record<string, number | undefined>;
  totalFpts2?: number;
}

/** One player's period score and the categories behind it. */
export interface RawPlayerStats {
  /** His total for the period. */
  object1?: number;
  object2?: RawCategoryStat[];
}

export interface RawCategoryStat {
  /** `"{groupId}#{categoryId}#{positionId}"`, position always `-1` here. Matching to `getLeagueInfo`'s names must drop
   *  that segment, or outfield Goals and Clean Sheets (no `-1` row there) are lost. */
  scipId?: string;
  /** As Fantrax renders it; `av` is the same as a number, for computing. */
  sv?: string;
  av?: number;
  fpts?: number;
}

export function mapLiveScores(raw: RawLiveScoring): LiveTeamScore[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const active = sections?.ACTIVE;
    if (!active) return [];
    return [
      {
        teamId,
        // A team with no total is null, never nought.
        points: typeof active.totalFpts === "number" ? active.totalFpts : null,
        toPlay: countToPlay(active.remainingEventPercent),
      },
    ];
  });
}

/** How many of the eleven still have football to come, counted from Fantrax's list: names nobody before a period opens. */
function countToPlay(remaining: Record<string, number | undefined> | undefined): number | null {
  if (!remaining) return null;
  const values = Object.values(remaining).filter((value) => typeof value === "number");
  if (values.length === 0) return null;
  return values.filter((value) => value > 0).length;
}

/** Fantrax's projected total per team, summed from ACTIVE projections (`totalFpts` is nought until kickoff).
 *  Group subtotals are skipped, or every projection roughly doubles; null, never nought, when nothing is projected. */
export function mapProjectedTotals(raw: RawLiveScoring): TeamProjection[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const projected = sections?.ACTIVE?.projectedTotalsMap;
    if (!projected) return [{ teamId, points: null }];

    let total = 0;
    let any = false;
    for (const [fantraxId, points] of Object.entries(projected)) {
      if (fantraxId.startsWith(GROUP_TOTAL) || typeof points !== "number") continue;
      total += points;
      any = true;
    }
    // Rounded to a tenth to drop floating-point noise.
    return [{ teamId, points: any ? Math.round(total * 10) / 10 : null }];
  });
}

/** What marks a `statsMap` key as a group subtotal rather than a player. */
const GROUP_TOTAL = "_";

/** Fantrax's key without the position segment (`"5010#6090#-1"` → `"5010#6090"`); null for a key not theirs. */
function categoryOf(scipId: string | undefined): string | null {
  if (typeof scipId !== "string") return null;
  const parts = scipId.split("#");
  return parts.length < 2 || parts[0] === "" || parts[1] === "" ? null : `${parts[0]}#${parts[1]}`;
}

/** Every ACTIVE player Fantrax priced this period, by team, at his slot; `categories` drops noughts, `counts` keeps them.
 *  A missing man is unplayed in the eleven or a reserve: only the roster knows, so a caller must not merge the two. */
export function mapLivePlayerPoints(raw: RawLiveScoring): LiveSquadPoints[] {
  return sectionPoints(raw, "ACTIVE");
}

/** The reserves Fantrax priced this period, which count in nobody's total. */
export function mapBenchPlayerPoints(raw: RawLiveScoring): LiveSquadPoints[] {
  return sectionPoints(raw, "BENCH");
}

function sectionPoints(raw: RawLiveScoring, which: keyof RawTeamSections): LiveSquadPoints[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const section = sections?.[which];
    if (!section) return [];

    const players: LivePlayerPoints[] = [];
    for (const [fantraxId, stats] of Object.entries(section.statsMap ?? {})) {
      // `_{groupId}` is a group subtotal, not a man; keeping it counts every team twice.
      if (fantraxId.startsWith(GROUP_TOTAL)) continue;
      // A stated nought is kept; a withheld total is skipped.
      if (typeof stats?.object1 !== "number") continue;
      // `sv`, not `av`: read back to a person as Fantrax rendered it.
      const counts = (stats.object2 ?? []).flatMap((row) => {
        const category = categoryOf(row.scipId);
        if (category === null || typeof row.fpts !== "number") return [];
        return [{ category, points: row.fpts, value: typeof row.sv === "string" ? row.sv : null }];
      });
      players.push({
        fantraxId,
        points: stats.object1,
        categories: counts.filter((row) => row.points !== 0),
        counts,
      });
    }
    return [{ teamId, players }];
  });
}
