// Reading a value out of JSON another program wrote: an export, a filed story.

/** A number that is really a number, or null: never a string, NaN or Infinity passed through as one. */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** A string, or "" for anything else. */
export function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A string with something in it, or null: "" reads as absent, like anything that is not a string. */
export function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/** An array's strings with something in them, or none: anything else in it is dropped. */
export function stringsOrEmpty(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item !== "") : [];
}

/** An object's fields to read one by one, or none: an array, a string, a number or null reads as an empty record. */
export function recordOrEmpty(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
