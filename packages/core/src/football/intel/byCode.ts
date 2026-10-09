// The rule every intel reader shares: rows are keyed on FPL's season-stable code, and a row without one is dropped.

/** Each row `read` keeps, by its FPL code; a row with no integer code is dropped, never kept under `NaN`. */
export function byCode<Row extends { code: number }, Kept>(
  rows: readonly Row[] | null | undefined,
  read: (row: Row) => Kept | null,
): Map<number, Kept> {
  const kept = new Map<number, Kept>();
  for (const row of rows ?? []) {
    if (!Number.isInteger(row?.code)) continue;
    const value = read(row);
    if (value !== null) kept.set(row.code, value);
  }
  return kept;
}
