import { describe, expect, it } from "vitest";
import { buildPresserBrief, type PresserLine } from "./presser";

const saka: PresserLine = {
  code: 223340, club: 3, tag: "ruled_out", condition: "hamstring", confidence: 0.9, said: "2026-10-08T12:00:00Z", manager: "Arteta",
  playerName: "Saka", clubName: "Arsenal", ownerName: "Dons", fresh: true,
};

describe("buildPresserBrief", () => {
  it("sets the clubs that spoke with nothing to report as a block of their own, and the reply's shape as another", () => {
    const quiet = buildPresserBrief({ gameweek: 7, lines: [saka], spoke: [{ clubName: "Everton", manager: "Moyes" }], threads: [] });
    expect(quiet).toContain("- Everton (Moyes)\n\nRETURN A ROW PER CLUB");
    const none = buildPresserBrief({ gameweek: 7, lines: [saka], threads: [] });
    expect(none).not.toContain("\n\n\n");
    expect(none).toContain("\n\nRETURN A ROW PER CLUB");
  });
});
