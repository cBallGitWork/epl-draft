import type { PeriodResult } from "../fantrax/results";

/** Seeds from one gameweek's Fantrax points, most first. Pass `teamIds` in league-table order: a tie
 *  goes to the higher place. A team with no score seeds below every team with one. */
export function seedByPoints(teamIds: readonly string[], results: readonly PeriodResult[], period: number): string[] {
  const scored = new Map(
    results.filter((result) => result.period === period).map((result) => [result.teamId, result.points]),
  );
  const points = (teamId: string) => scored.get(teamId) ?? null;
  return [...teamIds].sort((a, b) => {
    const pa = points(a);
    const pb = points(b);
    if (pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
    return pb - pa;
  });
}
