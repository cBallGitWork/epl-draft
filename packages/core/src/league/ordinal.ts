// `1` becomes `1st`, for a table's index cell.

const SUFFIX = ["th", "st", "nd", "rd"];

/** "1st", "2nd", "11th": the teens take "th". */
export function ordinal(place: number): string {
  const teens = place % 100;
  if (teens >= 11 && teens <= 13) return `${place}th`;
  return `${place}${SUFFIX[place % 10] ?? "th"}`;
}

/** Each team's place as a table prints it, by team id: `=1st` for a place two or more teams share. */
export function printedPlaces(rows: readonly { teamId: string; rank: number }[]): Map<string, string> {
  const holders = new Map<number, number>();
  for (const row of rows) holders.set(row.rank, (holders.get(row.rank) ?? 0) + 1);
  return new Map(rows.map((row) => [row.teamId, `${(holders.get(row.rank) ?? 0) > 1 ? "=" : ""}${ordinal(row.rank)}`]));
}
