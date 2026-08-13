import type { LiveTeamScore } from "../types";

// Fantrax's live-scoring page, which answers without a cookie and hands back
// typed numbers rather than the formatted strings the rest of their surface is
// made of (PLATFORM_NOTES, 13 Aug). One call carries every team in the league:
// their own page filters to a matchup in the browser, and passing `matchupId`
// changes nothing, so we ask once and read all of it.
//
// These are Fantrax's points, not ours. We compute no scoring — the real
// league scores five categories FPL does not even publish — so what this reads
// is the score, not an estimate of it.

/** The wire, mirrored including the parts we decline to read. */
export interface RawLiveScoring {
  statsPerTeam?: {
    allTeamsStats?: Record<string, RawTeamSections | undefined>;
  };
}

/** `BENCH` is only ever present for an authenticated caller, and only `ACTIVE`
 *  scores, so the public view is the whole answer for a scoreboard. */
export interface RawTeamSections {
  ACTIVE?: RawTeamSection;
  BENCH?: RawTeamSection;
}

export interface RawTeamSection {
  totalFpts?: number;
  /** Fraction of each player's fixture still to play, keyed by our `fantraxId`.
   *  1 before kickoff. */
  remainingEventPercent?: Record<string, number | undefined>;
  /** Fantrax's own per-player projection for the period. Players with no
   *  projection are omitted rather than zeroed. Not mapped: a projection is a
   *  different claim from a score and nothing shows one yet. */
  projectedTotalsMap?: Record<string, number | undefined>;
  /** Five unlabelled integers. Deliberately not modelled — reading meaning into
   *  a position we have only ever seen at rest would be inventing a fact. `toPlay`
   *  is counted from `remainingEventPercent`, which says what it means. */
  playerGameInfo?: number[];
}

export function mapLiveScores(raw: RawLiveScoring): LiveTeamScore[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const active = sections?.ACTIVE;
    if (!active) return [];
    return [
      {
        teamId,
        // Absence stays absence. A team Fantrax has no total for is not a team
        // on nought, and a scoreboard saying nought would be a confident lie.
        points: typeof active.totalFpts === "number" ? active.totalFpts : null,
        toPlay: countToPlay(active.remainingEventPercent),
      },
    ];
  });
}

/** How many of the eleven still have football to come.
 *
 *  Counted from the players Fantrax lists rather than from a roster size: before
 *  a period opens we are not allowed to know who is in the eleven, and this
 *  number is publishable either way because it names nobody. */
function countToPlay(remaining: Record<string, number | undefined> | undefined): number | null {
  if (!remaining) return null;
  const values = Object.values(remaining).filter((value) => typeof value === "number");
  if (values.length === 0) return null;
  return values.filter((value) => value > 0).length;
}
