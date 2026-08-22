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
  /** Fantrax's own "the round is over". Not read: the football layer answers the
   *  same question from FPL, which is the provider that actually knows, and a
   *  second opinion we would have to arbitrate is worse than one we would not. */
  allEventsFinished?: boolean;
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
  /** Five integers, decoded 22 Aug 2026 across a whole matchday and left
   *  unmodelled anyway:
   *
   *  `[0]` players who appeared and whose match is over · `[1]` players in a
   *  match in progress · `[2]` players still to come · `[3]` = `[0] × 90` ·
   *  `[4]` = `[2] × 90` plus the real minutes left in the matches under way.
   *
   *  `[1]` was verified against the count of `gameStatusMap` entries in state 2,
   *  and `[3]` is nominal — it read 180 for two men who played 67 and 75.
   *
   *  Still not read, because `toPlay` comes from `remainingEventPercent`, which
   *  says what it means without a decoding note. Written down because `[0]+[1]+[2]`
   *  falls short of eleven by exactly the number of men whose match ended without
   *  them, which is a fact worth having if anything ever wants it. */
  playerGameInfo?: number[];
  /** `"{OPP}~{kickoffEpochMs}|{gameId}|{state}"` before kickoff, and
   *  `"COV 0 @ ARS 3 F|{gameId}|{state}"` once it is under way. State 1 upcoming,
   *  2 in progress, 3 finished. Not read: this is football wearing league
   *  clothes, and the football layer already carries fixtures and scores from
   *  the provider whose job they are. */
  gameStatusMap?: Record<string, string | undefined>;
  /** Per player, his fantasy total for the period (`object1`) and the
   *  per-category rows behind it (`object2`), priced at the ROSTER SLOT.
   *
   *  Empty until a man has played. Not read yet, and the reason is worth keeping:
   *  this is the only slot-priced per-player number Fantrax publishes, so it is
   *  the fix for the head-to-head board disagreeing with its own total — see
   *  PLATFORM_NOTES, 22 Aug. That is a change to what four screens show and it is
   *  Craig's, not a Saturday's. */
  statsMap?: Record<string, unknown | undefined>;
  /** Empty on every section seen so far, including a full live matchday. */
  statsMap2?: Record<string, unknown | undefined>;
  /** Fantrax's projection updated for what has already happened: for a man whose
   *  match is done it is his actual score, where `projectedTotalsMap` stays the
   *  pre-game guess. The two were identical until football existed. Not read —
   *  nothing shows a projection. */
  calculatedProjectedTotalsMap?: Record<string, number | undefined>;
  projectedTotalsMap2?: Record<string, number | undefined>;
  totalFpts2?: number;
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
