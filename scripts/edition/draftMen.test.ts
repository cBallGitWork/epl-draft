import { describe, expect, it } from "vitest";
import type { FootballPlayer, Sheet, SheetMan } from "@epl/core";
import { draftManOf, type ManReads } from "./draftMen";

// One man at a cut-off with nothing else read: only his names are under test here.
const reads: ManReads = {
  gameweek: 5,
  last: "2026-09-20",
  fixtures: [],
  clubs: new Map(),
  byMan: new Map(),
  days: [],
  worth: { returns: {}, appearance: 0, keeper: null, bonus: {} },
  goals: new Map(),
  starters: new Map(),
  history: new Map(),
  projections: new Map(),
  arrivals: new Map(),
};
const manNamed = (name: string, fullName: string): SheetMan => ({ fantraxId: "x1", slot: "M", player: { code: 1, clubId: 3, name, fullName } as FootballPlayer });
const sheetOf = (man: SheetMan): Sheet => ({ teamId: "t1", teamName: "test4", starters: [man], bench: [] });
const named = (name: string, fullName: string) => {
  const man = manNamed(name, fullName);
  return draftManOf(man, sheetOf(man), reads);
};
const debutWith = (history: Sheet[]) => {
  const man = manNamed("Haaland", "Erling Haaland");
  return draftManOf(man, sheetOf(man), { ...reads, history: new Map([["t1", history]]) }).debut;
};

describe("draftManOf", () => {
  it("names a man as a report prints him, without the initial FPL tells a squad apart by", () => {
    // GW5's draft report printed "B.Fernandes", "N.Williams" and "E.Le Fée" in its line-ups and returns.
    expect(named("B.Fernandes", "Bruno Borges Fernandes").name).toBe("Fernandes");
    expect(named("N.Williams", "Neco Williams").name).toBe("Williams");
    expect(named("E.Le Fée", "Enzo Le Fée").name).toBe("Le Fée");
  });

  it("keeps a name with no initial as FPL gives it, Groß spelt as UK papers spell him", () => {
    expect(named("Haaland", "Erling Haaland").name).toBe("Haaland");
    expect(named("George Hemmings", "George Hemmings").name).toBe("George Hemmings");
    expect(named("Groß", "Pascal Groß").name).toBe("Gross");
  });

  it("finds no debut in a side's first fielded gameweek, however many empty periods came before the draft", () => {
    // The real league drafted on 3 Oct and plays from period 6: Fantrax answers periods 1 to 5 with empty rosters.
    const empty: Sheet = { teamId: "t1", teamName: "test4", starters: [], bench: [] };
    expect(debutWith([empty, empty, empty, empty, empty])).toBe(false);
    expect(debutWith([])).toBe(false);
  });

  it("finds a debut for a man who never started in a side's earlier fielded sheets", () => {
    const other = manNamed("Isak", "Alexander Isak");
    const earlier: Sheet = { teamId: "t1", teamName: "test4", starters: [{ ...other, fantraxId: "x2" }], bench: [] };
    expect(debutWith([earlier])).toBe(true);
  });
});
