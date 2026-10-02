// FPL's defensive contribution, a fixed rule: 10 CBIT for a defender, 12 CBIRT for a midfielder or forward, none for a keeper.

/** FPL's threshold by the position the team sheet named a man in, which stands in for FPL's own filing of him. */
const FPL_THRESHOLD: ReadonlyMap<string, number> = new Map([
  ["D", 10],
  ["M", 12],
  ["F", 12],
]);

/** FPL's threshold for a man, and the count from which he is close to it: half, floored. Null for a keeper or no position. */
export function fplDefConAt(position: string | null): { mark: number; close: number } | null {
  const mark = position === null ? undefined : FPL_THRESHOLD.get(position);
  return mark === undefined ? null : { mark, close: Math.floor(mark / 2) };
}
