// Reading a value out of JSON another program wrote: an export, a filed story.

/** A number that is really a number, or null: never a string, NaN or Infinity passed through as one. */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
