import { describe, expect, it } from "vitest";
import { buildPresserBrief, stillOut, type PresserLine } from "./presser";

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

  it("lists only a standing absence as STILL OUT, never a standing doubt or rotation risk", () => {
    const standing = (playerName: string, tag: string): PresserLine => ({ ...saka, playerName, tag, fresh: false });
    const lines = [standing("Saka", "ruled_out"), standing("Partey", "suspended"), standing("Rice", "rotation_risk"), standing("Odegaard", "injury_scare")];
    const brief = buildPresserBrief({ gameweek: 7, lines, threads: [] });
    expect(brief).toContain("STILL OUT, no change: Saka, Partey\n");
    expect(lines.filter(stillOut).map((line) => line.playerName)).toEqual(["Saka", "Partey"]);
  });
});
