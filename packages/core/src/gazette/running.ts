/** Whether a firing with `filed` stories written may attempt another. Count filed stories, never
 *  the loop index: a refusing desk spends no turn, or it blocks every assignment queued behind it. */
export function hasRoom(filed: number, cap: number): boolean {
  return filed < cap;
}
