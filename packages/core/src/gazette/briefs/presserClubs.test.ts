import { describe, expect, it } from "vitest";
import { carriesFact, presserClubs, teamSheetExpect, type ClubQuote } from "./presserClubs";
import type { PresserLine } from "./presser";

const line = (playerName: string, over: Partial<PresserLine> = {}): PresserLine => ({
  code: 1, club: 14, tag: "ruled_out", condition: "quad", confidence: 0.9, said: "2026-10-09T12:30:00Z", manager: "Andoni Iraola",
  playerName, clubName: "Liverpool", ownerName: null, fresh: true, ...over,
});
const quote = (text: string, over: Partial<ClubQuote> = {}): ClubQuote => ({ club: 14, clubName: "Liverpool", text, said: "Andoni Iraola", ...over });

// Every quote here is one the export of 9 Oct 2026 or 17 Sep 2026 holds, verbatim.
describe("carriesFact", () => {
  it("reads a timescale, a decision or a man's availability as a fact", () => {
    expect(carriesFact("Alex Isak and Cody Gakpo will not play the game. They are not ready.")).toBe(true);
    expect(carriesFact("Ezri and Kai we will see tomorrow.")).toBe(true);
    expect(carriesFact("Amad has done a little bit of training, Marcus has done a little bit of training.")).toBe(true);
    expect(carriesFact("Pedro and Mudryk, both are not available. Pedro, I think not for many games.")).toBe(true);
  });

  it("reads a man declining to give news, or praise, as no fact", () => {
    expect(carriesFact("I think it’s more or less the same as the other night, yeah. So, nothing has really changed on that front.")).toBe(false);
    expect(carriesFact("In form, in the opponent, in the relationship that we have within that unit, there are a lot of factors.")).toBe(false);
  });
});

describe("presserClubs", () => {
  const clubs = presserClubs(
    [line("Alexander Isak"), line("Conor Bradley", { fresh: false }), line("Jeremy Jacquet", { tag: "available", condition: "hamstring" })],
    [
      quote("I think it’s more or less the same as the other night, yeah."),
      quote("He’s fit. He’s ready to go. Still we need to train tomorrow, but he’s fine, yes.", { about: "Jeremy Jacquet" }),
      quote("Patrick came off and it looks like he will be out for probably a number of weeks.", { club: 1, clubName: "Manchester United", said: "Michael Carrick" }),
    ],
  );

  it("gives each club its men, its standing absences and its quotes, the ones with a fact first", () => {
    const [liverpool] = clubs;
    expect(liverpool.men.map((man) => man.playerName)).toEqual(["Alexander Isak", "Jeremy Jacquet"]);
    expect(liverpool.standing.map((man) => man.playerName)).toEqual(["Conor Bradley"]);
    expect(liverpool.quotes.map((each) => each.fact)).toEqual([true, false]);
  });

  it("keeps a club that only spoke, with its code off the quote", () => {
    expect(clubs.map((club) => [club.name, club.code])).toEqual([["Liverpool", 14], ["Manchester United", 1]]);
  });

  it("expects a line and a quote where a club said something with a fact, and a note where a man was given one", () => {
    const expected = teamSheetExpect(clubs);
    expect(expected.reported.map((club) => club.code)).toEqual([14, 1]);
    expect(expected.quoted.map((club) => club.code)).toEqual([14, 1]);
    expect(expected.noted).toEqual(["Alexander Isak", "Jeremy Jacquet"]);
  });

  it("expects nothing of a club whose only content is a standing absence, nor a note of a man given none", () => {
    const quiet = presserClubs([line("Conor Bradley", { fresh: false }), line("Kenny Tete", { club: 54, clubName: "Fulham", tag: "available", condition: undefined })], []);
    const expected = teamSheetExpect(quiet);
    expect(expected.reported.map((club) => club.code)).toEqual([54]);
    expect(expected.quoted).toEqual([]);
    expect(expected.noted).toEqual([]);
  });

  it("names a man in a quote by any part of his name, so his note can carry what was said", () => {
    const [liverpool] = presserClubs([line("Alexander Isak", { condition: undefined })], [quote("Alex Isak has a thigh injury.")]);
    expect(liverpool.named.has("Alexander Isak")).toBe(true);
  });
});
