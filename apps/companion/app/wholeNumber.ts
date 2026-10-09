/** A route segment, query value or cookie as the whole number it names (`6`), or null: `Number` reads "" as 0 and
 *  " 6", "6.0", "1e1" and "0x6" as numbers too. */
export function wholeNumber(text: string | undefined): number | null {
  return text !== undefined && /^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null;
}
