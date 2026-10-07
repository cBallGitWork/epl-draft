import { describe, expect, it } from "vitest";
import { plainText } from "./markup";

describe("plainText", () => {
  it("reads a cell's tags as spaces, so two lines do not run together", () => {
    expect(plainText("BOU<br/>Sun 9:00AM")).toBe("BOU Sun 9:00AM");
    expect(plainText("<b>D</b>: 2")).toBe("D : 2");
  });

  it("reads nothing but markup and space as no text at all", () => {
    expect(plainText("<br/> ")).toBeNull();
    expect(plainText(undefined)).toBeNull();
  });
});
