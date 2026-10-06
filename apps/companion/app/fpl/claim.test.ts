import { describe, expect, it } from "vitest";
import { claim } from "./claim";

const knows = (ids: number[]) => async (id: number) => ids.includes(id);

describe("claim", () => {
  it("keeps an id FPL has a team for", async () => {
    expect(await claim(" 3705919 ", knows([3705919]))).toEqual({ id: 3705919 });
  });

  it("refuses an id FPL has no team for, before it is saved (370591947, 6 Oct 2026)", async () => {
    expect(await claim("370591947", knows([3705919]))).toEqual({ refusal: "FPL has no team 370591947." });
  });

  it("refuses what is not a number without asking FPL", async () => {
    const never = async () => {
      throw new Error("asked FPL");
    };
    expect(await claim("abc", never)).toEqual({ refusal: "That is not an FPL team id." });
    expect(await claim("0", never)).toEqual({ refusal: "That is not an FPL team id." });
  });

  it("says FPL did not answer rather than breaking the page", async () => {
    const down = async () => {
      throw new Error("FPL 503");
    };
    expect(await claim("3705919", down)).toEqual({ refusal: "FPL did not answer. Try again in a minute." });
  });
});
