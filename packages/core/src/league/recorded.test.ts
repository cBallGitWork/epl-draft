import { describe, expect, it } from "vitest";
import { recordedRole } from "./recorded";

const FILE = { leagues: [{ key: "real", leagueId: "r1" }, { key: "dummy", leagueId: "d1" }], stats: "dummy", scoring: "real" };

describe("recordedRole", () => {
  it("reads the league each role names", () => {
    expect(recordedRole(FILE, "stats")).toBe("d1");
    expect(recordedRole(FILE, "scoring")).toBe("r1");
  });

  it("is null for a role naming a league the file does not list", () => {
    expect(recordedRole({ ...FILE, scoring: "gone" }, "scoring")).toBeNull();
  });
});
