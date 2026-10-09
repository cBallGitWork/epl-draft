import { describe, expect, it } from "vitest";
import { byCode } from "./byCode";

describe("byCode", () => {
  it("keys each row on its FPL code, dropping a row with no integer code and one `read` refuses", () => {
    const rows = [{ code: 1, x: "a" }, { code: Number.NaN, x: "b" }, { code: 2.5, x: "c" }, { code: 3, x: "" }, null];
    const kept = byCode(rows as { code: number; x: string }[], (row) => (row.x === "" ? null : row.x));
    expect([...kept]).toEqual([[1, "a"]]);
  });

  it("is empty for no file", () => {
    expect(byCode(undefined, (row: { code: number }) => row).size).toBe(0);
  });
});
