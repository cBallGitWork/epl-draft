import { creditedGoals, scoresheet, streamCredited } from "@epl/core";
import type { PlGoal, SheetRow, StreamCredit } from "@epl/core";

// One side of the match's scoresheet: its goals, credited, and the other marks it names its men for.

/** One side's goals, credited, and whatever else the sheet names its men for.
 *
 *  **Which goals are this side's is decided by the men, not by a club id.**
 *  `PlGoal.teamId` is the Premier League's and `Club.code` is FPL's, so rather
 *  than carry a third table the test is: a goal is ours when its scorer is one
 *  of our men, and an OWN goal is ours when its scorer is one of THEIRS.
 *
 *  **That second half used to read "when its scorer is not ours", and it put one
 *  own goal on both scoresheets.** A man the bridge cannot place is in neither
 *  side's rows, so "not ours" was true for both sides at once and Brighton 4-0
 *  Aston Villa printed Lindelöf's own goal twice — a sheet claiming five goals
 *  in a four-goal match. Naming the opponent's men makes the test exclusive:
 *  exactly one side can satisfy it, and a scorer neither side knows now appears
 *  on neither rather than on both. Losing a goal we cannot place is the lesser
 *  error, and it is the one DESIGN §7 asks for.
 *
 *  **`rest` is what a goal list would otherwise drop.** A sending off and a
 *  penalty missed are scoresheet entries; a booking is not, and `named` stopped
 *  letting one on this sheet on 10 Sep 2026.
 *
 *  Falls back to FPL's own scorers when the Premier League has no goals for the
 *  FIXTURE — their feed answers nothing for a match it has not filed, and the
 *  sheet is still true. Asked of the whole feed rather than of this side: a
 *  goalless side is not an unfiled match, and treating it as one is what put an
 *  own goal on two scoresheets. */
export function side(
  goals: readonly PlGoal[],
  rows: readonly SheetRow[],
  opponents: readonly SheetRow[],
  minutes: Map<number, number[]>,
  credits: readonly StreamCredit[],
  injured: ReadonlyMap<number, number>,
): { goals: PlGoal[]; rest: SheetRow[] } {
  const mine = new Set(rows.map((row) => row.player.code));
  const theirs = new Set(opponents.map((row) => row.player.code));
  const ours = goals.filter((goal) =>
    goal.scorer === null
      ? false
      : goal.own
        ? !mine.has(goal.scorer) && theirs.has(goal.scorer)
        : mine.has(goal.scorer),
  );
  const paid = new Map(
    rows.filter((row) => row.line.assists > 0).map((row) => [row.player.code, row.line.assists]),
  );
  // **The commentary first, and only if FPL's arithmetic confirms the lot.**
  // `creditedGoals` resolves exactly one case — one man short by exactly the
  // side's unexplained goals — and Man Utd 5-2 Ipswich is the shape it cannot
  // touch: three men each short by one against three unexplained goals, so it
  // credited nobody and the screen dropped three real assists. `streamCredited`
  // proposes all three off the textstream and returns null unless every name
  // agrees with FPL, which is when `creditedGoals` gets its go as before.
  // **The fallback is asked of the FEED, not of this side.** It was
  // `ours.length > 0`, which is a per-side test driving a per-match decision: a
  // side that simply did not score fell through to FPL's own scorers, and
  // Brighton 4-0 Aston Villa then printed Lindelöf's own goal on BOTH sheets —
  // once where the Premier League credited it, and once more because Villa's
  // empty column reached for FPL's list and found their own man's `own_goals`.
  // The question the fallback answers is "has the Premier League filed this
  // match at all", and `goals` is the whole match.
  const credited =
    goals.length > 0
      ? (streamCredited(ours, credits, paid) ?? creditedGoals(ours, paid))
      : fallbackGoals(rows, minutes);

  // Everyone the sheet names who is not already on a goal line.
  const named = new Set(
    credited.flatMap((goal) => [goal.scorer, goal.assister].filter((code) => code !== null)),
  );
  // **An injury gets a row even for a man already on a goal line**, which is the
  // one thing here that may name a man twice. Mitchell scored twice for Palace
  // AND was carried off at 74': the goals are one event and the injury is
  // another, and suppressing the second because the first exists would drop the
  // fact a reader came to this box for. Everything else stays as it was — a
  // penalty missed by a scorer is still folded into his goal row, because it is
  // the same shot.
  const rest = scoresheet(rows).filter(
    (row) =>
      injured.has(row.player.code) || (!named.has(row.player.code) && marksAnything(row)),
  );
  return { goals: credited, rest };
}

/** FPL's own scorers as goals, for a fixture the Premier League has not filed.
 *
 *  Their minutes come from `matchGoalMinutes`, which merges the sister repo's
 *  log; a scorer with neither reads as minute 0 and is dropped rather than drawn
 *  at the kick-off. */
function fallbackGoals(rows: readonly SheetRow[], minutes: Map<number, number[]>): PlGoal[] {
  return rows
    .flatMap((row) =>
      (minutes.get(row.player.code) ?? []).map((minute) => ({
        minute,
        teamId: 0,
        scorer: row.player.code,
        assister: null,
        own: row.line.ownGoals > 0 && row.line.goals === 0,
      })),
    )
    .sort((a, b) => a.minute - b.minute);
}

/** Whether a man belongs on the sheet for something other than a goal. */
function marksAnything(row: SheetRow): boolean {
  return row.line.redCards > 0 || row.line.penaltiesMissed > 0 || row.line.penaltiesSaved > 0;
}
