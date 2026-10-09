/** What the figures and the maps cover, for a screen reader: "this season" or "gameweeks 1 to 5". */
export function windowWords(recent: boolean, gameweeks: readonly number[]): string {
  if (!recent) return "this season";
  const [first, last] = [gameweeks[0], gameweeks[gameweeks.length - 1]];
  if (first === undefined || last === undefined) return "no gameweeks yet";
  return first === last ? `gameweek ${first}` : `gameweeks ${first} to ${last}`;
}
