import { describe, expect, it } from "vitest";
import { groupedBy } from "./grouped";

describe("groupedBy", () => {
  it("keeps the keys and each list in the order first met", () => {
    const grouped = groupedBy(["Saka D", "Rice M", "Raya G", "White D"], (man) => man.slice(-1));
    expect([...grouped.keys()]).toEqual(["D", "M", "G"]);
    expect(grouped.get("D")).toEqual(["Saka D", "White D"]);
  });

  it("gives no key at all to a group nobody is in", () => {
    expect(groupedBy([], (man: string) => man).size).toBe(0);
  });
});
