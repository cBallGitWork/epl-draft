// How a board orders two figures: the column's way, with an absent figure sinking whichever way it runs.
// A tie is 0, for each board to break its own way.

export function byFigure(left: number | string | null, right: number | string | null, descending: boolean): number {
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
  const order = typeof left === "string" && typeof right === "string" ? left.localeCompare(right) : Number(left) - Number(right);
  return order === 0 ? 0 : descending ? -order : order;
}
