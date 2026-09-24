import type { Marked } from "./record";

// What a predictions story carries beyond its prose, refused field by field at the edge like
// every other story's cargo.

/** A groaner the skit writer landed: its shape and whose name it was on. */
export interface StorySkit {
  shape: string;
  target: string | null;
}

/** His season's record, which the page prints at the head of his calls. */
export function normalizeRecord(raw: unknown): Marked | undefined {
  const record = raw as Partial<Marked> | null;
  const right = record?.right;
  const called = record?.called;
  if (!Number.isInteger(right) || !Number.isInteger(called)) return undefined;
  return (right as number) >= 0 && (right as number) <= (called as number) ? { right: right as number, called: called as number } : undefined;
}

export function normalizeSkit(raw: unknown): StorySkit[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const skit = raw.flatMap((edit: Partial<StorySkit> | null) =>
    typeof edit?.shape === "string" && edit.shape !== ""
      ? [{ shape: edit.shape, target: typeof edit.target === "string" && edit.target !== "" ? edit.target : null }]
      : [],
  );
  return skit.length === 0 ? undefined : skit;
}
