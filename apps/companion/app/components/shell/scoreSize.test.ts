import { describe, expect, it } from "vitest";
import { scoreSize } from "./scoreSize";

describe("the rail's score size", () => {
  it("keeps a typical week's score large", () => {
    expect(scoreSize("47–39")).toBe("text-lg");
  });

  it("steps down a rung for one side in three figures", () => {
    expect(scoreSize("103–98")).toBe("text-base");
  });

  it("steps down again when both sides pass a hundred", () => {
    expect(scoreSize("112–108")).toBe("text-sm");
  });
});
