// `1` becomes `1st`, for a table's index cell.

const SUFFIX = ["th", "st", "nd", "rd"];

/** "1st", "2nd", "11th": the teens take "th". */
export function ordinal(place: number): string {
  const teens = place % 100;
  if (teens >= 11 && teens <= 13) return `${place}th`;
  return `${place}${SUFFIX[place % 10] ?? "th"}`;
}
