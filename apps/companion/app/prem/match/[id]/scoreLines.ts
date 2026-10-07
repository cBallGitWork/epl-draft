import { creditSide, scoresheet } from "@epl/core";
import type { AssistKinds, PlGoal, SheetRow, StreamCredit } from "@epl/core";

/** One side's goals, credited, plus `rest`: red cards and penalties missed or saved. */
export function side(
  goals: readonly PlGoal[],
  rows: readonly SheetRow[],
  opponents: readonly SheetRow[],
  minutes: Map<number, number[]>,
  credits: readonly StreamCredit[],
  kinds: ReadonlyMap<number, AssistKinds>,
  injured: ReadonlyMap<number, number>,
): { goals: PlGoal[]; rest: SheetRow[] } {
  const mine = new Set(rows.map((row) => row.player.code));
  const theirs = new Set(opponents.map((row) => row.player.code));
  // Sides are told apart by their men (PL team ids and FPL codes differ). An own goal is ours only
  // when THEIR man scored it, so a scorer neither side knows lands on neither sheet, not both.
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
  // `creditSide` credits off the stats league's kinds, then the commentary, each checked with FPL.
  // Fall back only when the WHOLE match is unfiled: a per-side test put an own goal on both sheets.
  const credited =
    goals.length > 0
      ? creditSide(ours, credits, kinds, paid)
      : fallbackGoals(rows, minutes);

  // Everyone the sheet names who is not already on a goal line.
  const named = new Set(
    credited.flatMap((goal) => [goal.scorer, goal.assister].filter((code) => code !== null)),
  );
  // An injury gets a row even for a man already on a goal line; a scorer's missed penalty does not.
  const rest = scoresheet(rows).filter(
    (row) =>
      injured.has(row.player.code) || (!named.has(row.player.code) && marksAnything(row)),
  );
  return { goals: credited, rest };
}

/** FPL's own scorers, for a fixture the Premier League has not filed; no minute, no goal. */
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
