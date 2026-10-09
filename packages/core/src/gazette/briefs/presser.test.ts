import { describe, expect, it } from "vitest";
import { buildPresserBrief, stillOut, type PresserLine } from "./presser";
import { banned } from "../banned";
import { NEWS_GAPS } from "../teamSheetChecks";

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
    expect(brief).toContain("STILL OUT: Saka, Partey\n");
    expect(lines.filter(stillOut).map((line) => line.playerName)).toEqual(["Saka", "Partey"]);
  });

  // The Team Sheet of 9 Oct 2026: the export named no speaker for five clubs, and the column narrated the gap.
  describe("a club with no named speaker, or nothing new", () => {
    const unnamed = (playerName: string, tag: string, fresh: boolean, condition?: string): PresserLine =>
      ({ ...saka, playerName, tag, fresh, manager: "", condition, ownerName: null });
    const brief = buildPresserBrief({
      gameweek: 6,
      lines: [unnamed("Cristhian Mosquera", "available", true, "muscle"), unnamed("William Saliba", "ruled_out", false)],
      spoke: [{ clubName: "Arsenal", manager: null }, { clubName: "Ipswich Town", manager: null }],
      threads: [],
    });

    it("never offers a speaker it does not have", () => {
      expect(brief).not.toMatch(/said by\s*(null|,|\.|\[|$)/mu);
      expect(brief).not.toContain("Ipswich Town (null)");
    });

    it("gives a standing absence as a fact, never as nothing new", () => {
      expect(brief).toContain("- Arsenal (code 3): Cristhian Mosquera — FIT again — back from muscle");
      expect(brief).not.toContain("nothing new");
    });

    it("offers a fit man what he is back from, never a bare complaint", () => {
      expect(brief).not.toContain("(muscle)");
    });

    it("never itself uses a phrase the send-back refuses", () => {
      expect(banned(brief, NEWS_GAPS)).toEqual([]);
    });
  });
});
