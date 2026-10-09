import { describe, expect, it } from "vitest";
import type { SeasonTotals } from "@epl/core";
import { LISTS, asPrinted, leadersOf, listFor, printed, ranked, seasonRatings } from "./leaders";

const man = (code: number, name: string, figure: number) => ({ code, name, figure });
const footballer = (code: number, name: string, goals: number) => ({ code, name, season: { goals } as SeasonTotals });

describe("ranked", () => {
  it("puts the biggest first and lets level men share a place", () => {
    const list = ranked([man(1, "Saka", 3), man(2, "Haaland", 7), man(3, "Isak", 3), man(4, "Palmer", 2)], 10);
    expect(list.map((row) => [row.rank, row.name])).toEqual([[1, "Haaland"], [2, "Isak"], [2, "Saka"], [4, "Palmer"]]);
  });

  it("gives a nought no place and stops at the count asked for", () => {
    const list = ranked([man(1, "A", 0), man(2, "B", 5), man(3, "C", 4), man(4, "D", 1)], 2);
    expect(list.map((row) => row.name)).toEqual(["B", "C"]);
  });
});

describe("seasonRatings", () => {
  it("averages a man's marks once he is rated in half the matches the most-rated man is", () => {
    const ratings = seasonRatings(new Map([[1, [7, 8, 6, 9]], [2, [9.5]], [3, [6, 7]]]));
    expect([...ratings]).toEqual([[1, 7.5], [3, 6.5]]);
  });

  it("rates nobody when nobody has a mark", () => {
    expect(seasonRatings(new Map([[1, []]])).size).toBe(0);
  });
});

describe("the lists' figures", () => {
  it("prints expected goals to two places, ratings to one and counts whole", () => {
    expect(printed(listFor("xg"), 8.5)).toBe("8.50");
    expect(printed(listFor("rating"), 7.46)).toBe("7.5");
    expect(printed(listFor("points"), 1234)).toBe("1,234");
  });

  it("ranks two marks that print alike as level", () => {
    const rating = listFor("rating");
    const list = ranked([man(1, "Scott", asPrinted(rating, 6.27)), man(2, "Bogle", asPrinted(rating, 6.33))], 10);
    expect(list.map((row) => [row.rank, row.name])).toEqual([[1, "Bogle"], [1, "Scott"]]);
  });

  it("calls our marks match ratings, plainly; the cyan says whose they are", () => {
    expect(listFor("rating").title).toBe("Match ratings");
  });

  it("falls back to the top scorers for a key it does not know", () => {
    expect(listFor("nonsense").key).toBe("goals");
  });
});

describe("leadersOf", () => {
  const players = [footballer(1, "Saka", 3), footballer(2, "Palmer", 0)];
  const held = { rating: new Map([[1, 7.46]]), points: new Map([[2, 120], [9, 400]]), defcon: new Map<number, number>() };

  it("reads FPL's count for every man on the books, his nought included", () => {
    expect(leadersOf(listFor("goals"), players, held)).toEqual([man(1, "Saka", 3), man(2, "Palmer", 0)]);
  });

  it("reads a held figure only for a man on the books who has one, held to the places it prints", () => {
    expect(leadersOf(listFor("rating"), players, held)).toEqual([man(1, "Saka", 7.5)]);
    expect(leadersOf(listFor("points"), players, held)).toEqual([man(2, "Palmer", 120)]);
    expect(leadersOf(listFor("defcon"), players, held)).toEqual([]);
  });
});

describe("listFor", () => {
  it("falls back to the first list offered when the asked one is not", () => {
    const offered = LISTS.filter((list) => list.key !== "defcon");
    expect(listFor("defcon", offered).key).toBe("goals");
    expect(listFor("defcon").key).toBe("defcon");
  });
});
