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

  // Friday 9 Oct 2026: 13 of 14 clubs printed no line and 3 of 18 quotes ran, because the quotes sat in one block at
  // the foot of the brief and the rules said to leave a line empty.
  describe("a club that said something", () => {
    const brief = buildPresserBrief({
      gameweek: 6,
      lines: [saka, { ...saka, playerName: "William Saliba", fresh: false }],
      quotes: [
        { club: 3, clubName: "Arsenal", text: "I think it’s more or less the same as the other night, yeah.", said: "Mikel Arteta" },
        { club: 3, clubName: "Arsenal", text: "Bukayo is out for a few weeks with a hamstring.", said: "Mikel Arteta", about: "Bukayo Saka" },
        { club: 1, clubName: "Manchester United", text: "Patrick will be out for a number of weeks.", said: "Michael Carrick" },
      ],
      threads: [],
    });

    it("sets each club's quotes under it, the one with a fact first and marked", () => {
      const arsenal = brief.slice(brief.indexOf("- Arsenal (code 3)"));
      expect(arsenal.indexOf("QUOTE WITH A FACT")).toBeLessThan(arsenal.indexOf("more or less the same"));
      expect(arsenal.indexOf("Bukayo is out")).toBeLessThan(arsenal.indexOf("more or less the same"));
      expect(brief).toContain("- Manchester United (code 1):");
    });

    it("tells the writer which men a quote names, so a note carries what was said", () => {
      expect(brief).toMatch(/Saka \(Dons\) — OUT — he does not play \(hamstring\), said by Arteta \[NAMED IN A QUOTE BELOW\]/u);
    });

    it("asks a line of every club with news, and a quote of every club offered one with a fact", () => {
      expect(brief).toContain("what was decided, the timescale, the reason");
      expect(brief).toContain("EVERY CLUB WITH A QUOTE WITH A FACT PRINTS ONE");
      expect(brief).not.toContain("WHAT THEY ACTUALLY SAID — verbatim");
    });

    it("never itself uses a phrase the send-back refuses", () => {
      expect(banned(brief, NEWS_GAPS)).toEqual([]);
    });
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

    // "Pedro Porro, Mykhailo Mudryk, Xavi, Wilson Odobert and Dejan Kulusevski are all still absent." over the same five.
    it("asks for no line where a club has nothing beyond its lists, never a line that repeats them", () => {
      expect(brief).toContain('leave "line" empty');
      expect(brief).not.toContain("who is still out, plainly");
      expect(brief).not.toContain("its line is who is still out");
    });

    it("never itself uses a phrase the send-back refuses", () => {
      expect(banned(brief, NEWS_GAPS)).toEqual([]);
    });
  });
});
