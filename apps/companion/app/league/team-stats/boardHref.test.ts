import { describe, expect, it, vi } from "vitest";
import { boardHref } from "./boardHref";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => import("../../components/shell/Link"));

describe("the team stats board's links", () => {
  it("spells the default measure as no parameter", () => {
    expect(boardHref("points", "attacking", "G")).toBe("/league/team-stats?group=attacking&cat=G");
    expect(boardHref("value", "attacking", "G")).toBe("/league/team-stats?group=attacking&cat=G&by=value");
  });

  it("keeps the measure on screen when a group plate changes the group", () => {
    // On Total or Squad, a group plate flipped the board back to FPts.
    expect(boardHref("squad", "defending")).toBe("/league/team-stats?group=defending&by=squad");
    expect(boardHref("points", "defending")).toBe("/league/team-stats?group=defending");
  });
});
