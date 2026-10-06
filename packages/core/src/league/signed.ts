// A figure that can go either way, signed: the sign only, never the colour, which each call site reads its own way.

/** "+4", "-2", "0": nought carries no sign. */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
