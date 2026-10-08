import { describe, expect, it } from "vitest";
import { finiteOrNull, recordOrEmpty, stringOrEmpty, stringsOrEmpty, textOrNull } from "./untrusted";

describe("finiteOrNull", () => {
  it("passes a real number and refuses everything dressed as one", () => {
    expect(finiteOrNull(0)).toBe(0);
    expect(finiteOrNull(-1.5)).toBe(-1.5);
    for (const bad of ["3", Number.NaN, Number.POSITIVE_INFINITY, null, undefined, {}]) expect(finiteOrNull(bad)).toBeNull();
  });
});

describe("stringOrEmpty", () => {
  it("passes a string, untrimmed, and reads anything else as empty", () => {
    expect(stringOrEmpty(" Saka ")).toBe(" Saka ");
    for (const bad of [7, null, undefined, {}, ["Saka"]]) expect(stringOrEmpty(bad)).toBe("");
  });
});

describe("recordOrEmpty", () => {
  it("passes an object to read and reads anything else as no fields", () => {
    expect(recordOrEmpty({ name: "Saka" }).name).toBe("Saka");
    for (const bad of ["Saka", 7, null, undefined, ["Saka"]]) expect(recordOrEmpty(bad)).toEqual({});
  });
});

describe("textOrNull", () => {
  it("passes a string with something in it, untrimmed, and reads the empty and anything else as absent", () => {
    expect(textOrNull(" Saka ")).toBe(" Saka ");
    for (const bad of ["", 7, null, undefined, {}, ["Saka"]]) expect(textOrNull(bad)).toBeNull();
  });
});

describe("stringsOrEmpty", () => {
  it("keeps an array's non-empty strings in order and drops the rest", () => {
    expect(stringsOrEmpty(["Saka", "", 7, null, "Rice"])).toEqual(["Saka", "Rice"]);
    for (const bad of ["Saka", 7, null, undefined, {}]) expect(stringsOrEmpty(bad)).toEqual([]);
  });
});
