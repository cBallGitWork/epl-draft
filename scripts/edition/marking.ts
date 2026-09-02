import {
  type Assignment,
  FANTRAX_LEAGUE_ID,
  type LeagueInfo,
  type PublishedStory,
  decided,
  fetchLiveScoring,
  mapLiveScores,
  markCalls,
  periodPairings,
} from "@epl/core";

// How the predictions column gets its score.
//
// Its own file rather than another helper at the foot of the writer: it makes a
// read of its own, against a period nothing else in the firing looks at, and
// `write-edition.ts` had crossed CODE_RULES §4's 300-line ceiling carrying it.

/** Last week's calls, marked against last week's results.
 *
 *  A conditional read, and the only one in the script: it fetches the previous
 *  period's scores ONLY when a predictions column is actually due and there
 *  are calls on file to mark. Every other firing pays nothing for it.
 *
 *  **Not this period's, which is the bug this replaces.** The predictions
 *  column files in the lock window, where by construction the round has not
 *  finished — so marking it against its own round could never produce a
 *  number, and the "you called N of 8" block was dead. A pundit is marked on
 *  LAST week: the calls are on file, the results came in, and the next column
 *  opens by owning the score.
 *
 *  It was also looking for a `round-preview` rather than a `predictions`
 *  story, so even reached it would have marked the wrong column's calls. */
export async function markLastWeek(
  paper: PublishedStory[],
  info: LeagueInfo,
  period: number,
  assignments: readonly Assignment[],
): Promise<{ right: number; called: number } | null> {
  if (!assignments.some((assignment) => assignment.kind === "predictions")) return null;

  const last =
    paper
      .filter(
        (story) =>
          story.leagueId === FANTRAX_LEAGUE_ID &&
          story.kind === "predictions" &&
          story.period < period,
      )
      .sort((a, b) => b.period - a.period)[0] ?? null;
  if (last === null) return null;

  const raw = await fetchLiveScoring(FANTRAX_LEAGUE_ID, last.period).catch(() => null);
  if (raw === null) return null;

  const scores = new Map(mapLiveScores(raw).map((score) => [score.teamId, score]));
  return markCalls(
    last.ties,
    decided(periodPairings(info.matchups, info.teams, last.period), scores),
  );
}
