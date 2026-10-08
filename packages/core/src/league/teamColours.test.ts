import { describe, expect, it } from "vitest";
import { coloursOf } from "./teamColours";

const TABLE = { styled: { primary: "#0b5cd5", secondary: "#FFFFFF" } };

describe("coloursOf", () => {
  it("gives a listed team its own colour", () => {
    expect(coloursOf(TABLE, "styled").primary).toBe("#0b5cd5");
  });

  it("falls back for a team nobody has styled", () => {
    expect(coloursOf(TABLE, "a-real-league-id-nobody-has-added")).toEqual(coloursOf(TABLE, "another-unlisted-id"));
    expect(coloursOf(TABLE, "a-real-league-id-nobody-has-added")).not.toEqual(coloursOf(TABLE, "styled"));
  });

  it("never returns nothing, whatever it is asked", () => {
    expect(coloursOf({}, "").primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
