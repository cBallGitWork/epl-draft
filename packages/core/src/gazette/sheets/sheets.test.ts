import { describe, expect, it } from "vitest";
import { benchings, type Projected } from "./benchings";
import type { StorySheet } from "./cargo";
import { changesBetween, debuts } from "./changes";
import { assembleSheets, plainLine, sheetsDeck, sheetsKey } from "./column";
import { crossovers } from "./crossovers";
import { sheetsFacts } from "./facts";
import { starterFlags } from "./flags";
import { inForm } from "./form";
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

  it("counts no changes on an unchanged eleven", () => {
    expect(changesBetween(before, [before])).toMatchObject({ count: 0, in: [], out: [] });
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
  it("flags a starter whose club has no match, one in the news, and one who might not start for his club", () => {
    const sheet = { ...side("a", []), starters: [man("Isak:F:5"), man("Saka:M:1"), man("Rice:M:1"), man("Wood:F:6")] };
    const story = { id: "1", headline: "Saka limps off", content: "Saka limped off in training.", analysis: null, at: 1 };
    const flags = starterFlags(sheet, { playing: new Set([1, 6]), news: (each) => (each.player.name === "Saka" ? story : null), predicted: (each) => (each.player.name === "Saka" || each.player.name === "Rice" ? false : null) });
    expect(flags.map((flag) => [flag.kind, flag.man.player.name])).toEqual([["no-fixture", "Isak"], ["news", "Saka"], ["may-not-start", "Rice"]]);
  });
});

describe("a stale story", () => {
  it("gives way to the plain status when the listing is newer, and stands when it is not", () => {
    const loaned = { ...side("a", []), starters: [man("Millar:M:1", { status: "u", newsAdded: "2026-09-10T00:00:00Z" })] };
    const story = (at: number) => () => ({ id: "1", headline: "", content: "Millar scored.", analysis: null, at });
    const flag = (at: number) => starterFlags(loaned, { playing: new Set([1]), news: story(at), predicted: () => null })[0]?.kind;
    expect(flag(Date.parse("2026-08-29T00:00:00Z"))).toBe("unavailable");
    expect(flag(Date.parse("2026-09-12T00:00:00Z"))).toBe("news");
  });
});

describe("inForm", () => {
  const game = (goals: number, assists = 0, cleanSheets = 0, minutes = 90) => ({ gameweek: 1, minutes, goals, assists, cleanSheets, points: 0 });
  it("names a man who scored in every round, a keeper who kept three clean sheets, and a man on the bench after the starters", () => {
    const sheet = side("a", ["Raya:G:1", "Isak:F:5", "Wood:F:6"], ["Eze:M:8"]);
    const recent = (each: { player: { name: string } }) =>
      ({ Raya: [game(0, 0, 1), game(0, 0, 1), game(0, 0, 1)], Isak: [game(1), game(1), game(2)], Wood: [game(1), game(0), game(0)], Eze: [game(2), game(1, 1), game(0)] })[each.player.name] ?? [];
    expect(inForm(sheet, recent).map((form) => [form.man.player.name, form.scoredEvery, form.cleanEvery])).toEqual([["Isak", true, false], ["Raya", false, true]]);
  });

  it("claims nothing off fewer rounds than it reads", () => {
    expect(inForm(side("a", ["Isak:F:5"]), () => [game(3), game(3)])).toEqual([]);
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

  it("leaves out a starter listed injured, suspended or gone", () => {
    const home = { ...side("h", []), starters: [man("Millar:M:13", { status: "u" })] };
    expect(crossovers(home, side("w", ["Pickford:G:12"]), [{ homeClubId: 13, awayClubId: 12 }])).toEqual([]);
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
      news: () => null,
      recent: () => [],
      predicted: () => null,
    });

  it("skips a head-to-head whose side fielded nobody, as a pre-draft period does", () => {
    const empty = sheetsFacts({ pairings, history: new Map(), projected: () => null, fixtures: [], lastWrote: new Map(), playing: new Set<number>(), news: () => null, recent: () => [], predicted: () => null, sheets: new Map([["h", side("h", [])], ["w", side("w", XI)]]) });
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
    const column = assembleSheets({ gameweek: 6, ties, against: (clubId) => (clubId === 1 ? "EVE (H)" : null), draft: new Map([["w", "Team w start two men."], [sheetsKey("h", "w"), "Invented."]]) });
    expect(column.headline).toBe("Team news: Gameweek 6");
    const [sheet] = column.sheets as StorySheet[];
    expect(sheet.home.line).toBe("Team h name their first sheet in a 3-4-3.");
    expect(sheet.home.xi[0]).toMatchObject({ name: "Raya", slot: "G", against: "EVE (H)" });
    expect(sheet.away.line).toBe("Team w start two men.");
    expect(sheet.between).toBe("");
  });
});
