import { describe, expect, it } from "vitest";
import { yoursFirst } from "./mine";

describe("yoursFirst", () => {
  it("lifts yours to the top and keeps everyone else's order", () => {
    expect(yoursFirst(["a", "b", "c", "d"], (x) => x === "c")).toEqual(["c", "a", "b", "d"]);
  });

  it("hands the list back untouched to a reader who owns nothing", () => {
    expect(yoursFirst(["b", "a"], () => false)).toEqual(["b", "a"]);
  });
});
