import { describe, expect, it, vi } from "vitest";
import { repeatedKeys } from "../../repeatedKeys";
import CompareMap from "./CompareMap";

vi.mock("@/app/desk", () => import("../../desk"));

describe("CompareMap", () => {
  it("keys each man apart when two share a name", () => {
    // Web names are not unique: two Wilsons, two Johnsons, two Gomes.
    const map = CompareMap({
      men: [
        { name: "Wilson", club: undefined, shots: [] },
        { name: "Wilson", club: undefined, shots: [] },
      ],
      passes: true,
      window: "this season",
    });
    expect(repeatedKeys(map)).toEqual([]);
  });
});
