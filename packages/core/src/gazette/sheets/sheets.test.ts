import { describe, expect, it } from "vitest";
import { benchings, type Projected } from "./benchings";
import type { StorySheet } from "./cargo";
import { changesBetween, debuts } from "./changes";
import { assembleSheets, plainLine, sheetsDeck, sheetsKey } from "./column";
import { crossovers } from "./crossovers";
import { sheetsFacts } from "./facts";
import { starterFlags } from "./flags";
import { formation, sheetOf } from "./sheet";
import { codeOf, man, rostered, side } from "./__fixtures__/sides";

const XI = ["Raya:G:1", "Saliba:D:1", "Gabriel:D:1", "Munoz:D:2", "Rice:M:1", "Saka:M:1", "Palmer:M:3", "Mbeumo:M:4", "Isak:F:5", "Wood:F:6", "Watkins:F:7"];

describe("sheetOf", () => {
  it("reads a side in team-sheet order, starters and bench apart, and its shape off the slots", () => {
    const sheet = sheetOf(rostered("a", ["Isak:F:5", "Raya:G:1", "Rice:M:1", "Saliba:D:1"], ["Kepa:G:1"]));
    expect(sheet.starters.map((each) => each.player.name)).toEqual(["Raya", "Saliba", "Rice", "Isak"]);
    expect(sheet.bench.map((each) => each.player.name)).toEqual(["Kepa"]);
    expect(formation(side("a", XI))).toBe("3-4-3");
  });
});

describe("changesBetween and debuts", () => {
  const before = side("a", XI, ["Eze:M:8", "Kepa:G:1"]);

  it("has nothing to say on a side's first sheet", () => {
    expect(changesBetween(before, [])).toBeNull();
    expect(debuts(before, [])).toBeNull();
  });

  it("tells a man off the bench from a new signing, and a man dropped from a man gone", () => {
    const now = side("a", XI.map((spec) => (spec.startsWith("Palmer") ? "Eze:M:8" : spec.startsWith("Wood") ? "Ekitike:F:9" : spec)), ["Palmer:M:3", "Kepa:G:1"]);
    const changes = changesBetween(now, [before]);
    expect(changes?.count).toBe(2);
    expect(changes?.in.map((each) => [each.man.player.name, each.from])).toEqual([["Eze", "bench"], ["Ekitike", "signed"]]);
    expect(changes?.out.map((each) => [each.man.player.name, each.to])).toEqual([["Palmer", "bench"], ["Wood", "gone"]]);
    expect(debuts(now, [before])?.map((each) => each.player.name)).toEqual(["Eze", "Ekitike"]);
  });

  it("counts the rounds an eleven has gone unchanged", () => {
    expect(changesBetween(before, [before, before])?.unchangedFor).toBe(3);
    expect(changesBetween(before, [before])).toMatchObject({ count: 0, unchangedFor: 2 });
  });

  it("is no debut for a man who started for the side in any earlier round", () => {
    const earlier = side("a", ["Eze:M:8"]);
    const now = side("a", ["Eze:M:8"]);
    expect(debuts(now, [earlier, side("a", ["Rice:M:1"])])).toEqual([]);
  });
});

describe("benchings", () => {
  const sheet = side("a", XI, ["Eze:M:8", "Kepa:G:1"]);
  const reading = (points: Record<string, number>, start = 0.9) => (code: number): Projected | null => {
    const name = Object.keys(points).find((each) => codeOf(each) === code);
    return name === undefined ? null : { points: points[name], start };
  };

  it("names a benched man projected at least the margin above the weakest starter in his slot", () => {
    const found = benchings(sheet, reading({ Eze: 6, Rice: 5, Saka: 7, Palmer: 4.5, Mbeumo: 5.5 }), undefined);
    expect(found.map((each) => [each.man.player.name, each.over.player.name, each.best])).toEqual([["Eze", "Palmer", false]]);
  });

  it("is quiet under the margin, on a man unlikely to start for his club, or with no reading", () => {
    expect(benchings(sheet, reading({ Eze: 5, Palmer: 4.5 }), undefined)).toEqual([]);
    expect(benchings(sheet, reading({ Eze: 9, Palmer: 4.5 }, 0.3), undefined)).toEqual([]);
    expect(benchings(sheet, reading({ Palmer: 4.5 }), undefined)).toEqual([]);
  });

  it("says when he sat last round too, and when nobody in his slot is projected higher", () => {
    const [found] = benchings(sheet, reading({ Eze: 9, Palmer: 4.5, Rice: 5 }), sheet);
    expect(found).toMatchObject({ best: true, again: true });
  });
});

describe("starterFlags", () => {
  it("flags a starter whose club has no match, one FPL doubts, and one his club's eleven leaves out", () => {
    const sheet = { ...side("a", []), starters: [man("Isak:F:5"), man("Saka:M:1", { status: "d", chanceOfPlaying: 50, news: "Knock" }), man("Rice:M:1"), man("Wood:F:6")] };
    const flags = starterFlags(sheet, { playing: new Set([1, 6]), predicted: (each) => (each.player.name === "Rice" ? false : null) });
    expect(flags.map((flag) => [flag.kind, flag.man.player.name])).toEqual([["no-fixture", "Isak"], ["doubt", "Saka"], ["not-predicted", "Rice"]]);
  });
});

describe("crossovers", () => {
  it("puts one side's attack against the other's keeper first, then a shared defence", () => {
    const home = side("h", ["Haaland:F:11", "Saliba:D:1"]);
    const away = side("w", ["Pickford:G:12", "Gabriel:D:1"]);
    const found = crossovers(home, away, [{ homeClubId: 11, awayClubId: 12 }]);
    expect(found.map((each) => each.kind)).toEqual(["facing", "defence"]);
    expect(found[0]).toMatchObject({ attackTeamId: "h", defendTeamId: "w" });
  });

  it("finds nothing between clubs that do not meet and a defence nobody shares", () => {
    expect(crossovers(side("h", ["Haaland:F:11"]), side("w", ["Pickford:G:12"]), [])).toEqual([]);
  });
});

describe("sheetsFacts and the column", () => {
  const pairings = [{ home: { teamId: "h" }, away: { teamId: "w" } }];
  const facts = (history: Map<string, ReturnType<typeof side>[]>) =>
    sheetsFacts({
      pairings,
      sheets: new Map([["h", side("h", XI)], ["w", side("w", ["Pickford:G:12", "Haaland:F:11"])]]),
      history,
      projected: () => null,
      fixtures: [],
      lastWrote: new Map(),
      playing: new Set([1, 2, 3, 4, 5, 6, 7, 11, 12]),
      predicted: () => null,
    });

  it("skips a head-to-head whose side fielded nobody, as a pre-draft period does", () => {
    const empty = sheetsFacts({ pairings, history: new Map(), projected: () => null, fixtures: [], lastWrote: new Map(), playing: new Set<number>(), predicted: () => null, sheets: new Map([["h", side("h", [])], ["w", side("w", XI)]]) });
    expect(empty).toEqual([]);
  });

  it("files the first round as first sheets, with no changes and no debuts", () => {
    const ties = facts(new Map());
    expect(sheetsDeck(ties)).toBe("The first sheets of the season, two sides.");
    expect(plainLine(ties[0].home)).toBe("Team h name their first sheet in a 3-4-3.");
  });

  it("counts the round's changes and debuts into the deck, ignoring an empty earlier period", () => {
    const ties = facts(new Map([["h", [side("h", []), side("h", XI.slice(0, 10))]], ["w", [side("w", ["Pickford:G:12", "Haaland:F:11"])]]]));
    expect(sheetsDeck(ties)).toBe("One change across two sides, one debut.");
    expect(plainLine(ties[0].home)).toBe("Team h make one change: Watkins comes in.");
  });

  it("prints the eleven and the bench from the facts and the desk's line where a paragraph failed", () => {
    const ties = facts(new Map());
    const column = assembleSheets({ gameweek: 6, ties, draft: new Map([["w", "Team w start two men."], [sheetsKey("h", "w"), "Invented."]]) });
    expect(column.headline).toBe("Team news: Gameweek 6");
    const [sheet] = column.sheets as StorySheet[];
    expect(sheet.home.line).toBe("Team h name their first sheet in a 3-4-3.");
    expect(sheet.home.xi[0]).toBe("Raya");
    expect(sheet.away.line).toBe("Team w start two men.");
    expect(sheet.between).toBe("");
  });
});
