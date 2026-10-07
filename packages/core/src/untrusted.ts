// Reading a value out of JSON another program wrote: an export, a filed story.

/** A number that is really a number, or null: never a string, NaN or Infinity passed through as one. */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** A string, or "" for anything else. */
export function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** An object's fields to read one by one, or none: a string, a number or null reads as an empty record. */
export function recordOrEmpty(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
