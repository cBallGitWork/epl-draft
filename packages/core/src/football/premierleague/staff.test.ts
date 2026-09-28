import { describe, expect, it } from "vitest";
import { plManager } from "./staff";

const official = (display: string, role = "Manager") => ({ role, active: true, name: { display } });

describe("plManager", () => {
  it("names the one manager", () => {
    expect(plManager({ officials: [official("Roberto De Zerbi"), official("Bruno Saltor", "Assistant Manager")] })).toBe("Roberto De Zerbi");
  });

  it("names nobody when two are listed, as Forest, Chelsea, Palace and Ipswich were on 28 Sep 2026", () => {
    expect(plManager({ officials: [official("Vítor Pereira"), official("Oliver Glasner")] })).toBeNull();
  });

  it("names nobody when there is no list", () => {
    expect(plManager({})).toBeNull();
  });
});
