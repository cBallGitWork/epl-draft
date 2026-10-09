import { describe, expect, it } from "vitest";
import { benchings } from "./benchings";
import type { StorySheet } from "./cargo";
import { changesBetween, debuts } from "./changes";
import { assembleSheets, plainLine, sheetsDeck } from "./column";
import { crossovers } from "./crossovers";
import { sheetsFacts } from "./facts";
import { injuryIn, starterFlags } from "./flags";
import { inForm } from "./form";
import { formation, fullPrintName, printName, sheetOf } from "./sheet";
import { man, rostered, side } from "./__fixtures__/sides";

const XI = ["Raya:G:1", "Saliba:D:1", "Gabriel:D:1", "Munoz:D:2", "Rice:M:1", "Saka:M:1", "Palmer:M:3", "Mbeumo:M:4", "Isak:F:5", "Wood:F:6", "Watkins:F:7"];

describe("sheetOf", () => {
  it("reads a side in team-sheet order, starters and bench apart, and its shape off the slots", () => {
    const sheet = sheetOf(rostered("a", ["Isak:F:5", "Raya:G:1", "Rice:M:1", "Saliba:D:1"], ["Kepa:G:1"]));
    expect(sheet.starters.map((each) => each.player.name)).toEqual(["Raya", "Saliba", "Rice", "Isak"]);
    expect(sheet.bench.map((each) => each.player.name)).toEqual(["Kepa"]);
    expect(formation(side("a", XI))).toBe("3-4-3");
  });

  it("prints a surname without FPL's initial", () => {
    expect(printName(man("B.Fernandes:M:1").player)).toBe("Fernandes");
    expect(printName(man("E.Le Fée:M:1").player)).toBe("Le Fée");
    expect(printName(man("Saka:M:1").player)).toBe("Saka");
  });

  it("prints a man's first name as a paper does, and leaves a man known by one name alone", () => {
    const named = (name: string, fullName: string) => fullPrintName({ ...man(`${name}:M:1`).player, name, fullName });
    expect(named("B.Fernandes", "Bruno Borges Fernandes")).toBe("Bruno Fernandes");
    expect(named("E.Le Fée", "Enzo Le Fée")).toBe("Enzo Le Fée");
    expect(named("Vuskovic", "Luka Vušković")).toBe("Luka Vuskovic");
    expect(named("Rodri", "Rodrigo Hernández Cascante")).toBe("Rodri");
    expect(named("Gabriel", "Gabriel dos Santos Magalhães")).toBe("Gabriel");
    expect(named("George Hemmings", "George Hemmings")).toBe("George Hemmings");
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
  const game = (goals: number, assists = 0, cleanSheets = 0) => ({ gameweek: 1, minutes: 90, goals, assists, cleanSheets, points: 0 });
  const form = (games: Record<string, ReturnType<typeof game>[]>) => (each: { player: { name: string } }) => games[each.player.name] ?? [];

  it("names a benched man with a goal or assist last time out, or goals and assists across the rounds", () => {
    expect(benchings(sheet, form({ Eze: [game(0), game(0), game(0, 1)] }), undefined).map((each) => each.man.player.name)).toEqual(["Eze"]);
    expect(benchings(sheet, form({ Eze: [game(1), game(1), game(0)] }), undefined).map((each) => each.man.player.name)).toEqual(["Eze"]);
    expect(benchings(sheet, form({ Kepa: [game(0, 0, 1), game(0, 0, 1), game(0, 0, 1)] }), undefined).map((each) => each.man.player.name)).toEqual(["Kepa"]);
  });

  it("is quiet on a benched man with nothing to show", () => {
    expect(benchings(sheet, form({ Eze: [game(0), game(1), game(0)] }), undefined)).toEqual([]);
    expect(benchings(sheet, () => [], undefined)).toEqual([]);
  });

  it("says when he was dropped after starting last round, and when he was benched then too", () => {
    const before = side("a", [...XI.slice(0, 6), "Eze:M:8"], ["Palmer:M:3", "Kepa:G:1"]);
    const [eze] = benchings(sheet, form({ Eze: [game(0), game(0), game(1)] }), before);
    expect(eze).toMatchObject({ dropped: true, again: false });
    const [kepa] = benchings(sheet, form({ Kepa: [game(0), game(0), game(0, 0, 1)] }), before);
    expect(kepa).toMatchObject({ dropped: false, again: true });
  });
});

describe("starterFlags", () => {
  it("flags a man whose club has no match, one out, one a doubt, and one who might not start for his club", () => {
    const sheet = { ...side("a", []), starters: [man("Isak:F:5"), man("Saka:M:1", { status: "i" }), man("Dunk:D:1", { status: "d" }), man("Rice:M:1"), man("Foden:M:1", { status: "s" })] };
    const report = { id: "1", headline: "", content: "Saka (hamstring) is out for a month.", analysis: null, at: 1 };
    const flags = starterFlags(sheet, { playing: new Set([1, 6]), news: (each) => (each.player.name === "Saka" ? report : null), predicted: (each) => (each.player.name === "Rice" ? false : null) });
    expect(flags.map((flag) => [flag.kind, flag.man.player.name, "injury" in flag ? flag.injury : undefined])).toEqual([
      ["no-fixture", "Isak", undefined], ["out", "Saka", "hamstring"], ["doubt", "Dunk", null], ["may-not-start", "Rice", undefined], ["out", "Foden", null],
    ]);
  });
});

describe("injuryIn and a stale story", () => {
  const report = (content: string, at = 1) => ({ id: "1", headline: "", content, analysis: null, at });
  it("reads the complaint from the report's brackets, else its opening sentence, else nothing", () => {
    expect(injuryIn(report("Rodon (hamstring) will be sidelined."))).toBe("hamstring");
    expect(injuryIn(report("Dunk is ruled out with a stiff neck. He is back in training soon."))).toBe("neck");
    expect(injuryIn(report("Wissa has started all five matches."))).toBeNull();
  });

  it("names the complaint the sentence gives first, not the first on its own list", () => {
    expect(injuryIn(report("Saka has a calf strain and will have his knee checked. More later."))).toBe("calf");
  });

  it("drops a report older than his listing, so a loan is not told as last month's goal", () => {
    const loaned = { ...side("a", []), starters: [man("Millar:M:1", { status: "u", newsAdded: "2026-09-10T00:00:00Z" })] };
    const flags = (at: number) => starterFlags(loaned, { playing: new Set([1]), news: () => report("Millar (knee) scored.", at), predicted: () => null });
    expect(flags(Date.parse("2026-08-29T00:00:00Z"))[0]).toMatchObject({ kind: "out", why: "unavailable", injury: null });
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
      fixtures: [],
      lastWrote: new Map(),
      playing: new Set([1, 2, 3, 4, 5, 6, 7, 11, 12]),
      news: () => null,
      recent: () => [],
      predicted: () => null,
    });

  it("skips a head-to-head whose side fielded nobody, as a pre-draft period does", () => {
    const empty = sheetsFacts({ pairings, history: new Map(), fixtures: [], lastWrote: new Map(), playing: new Set<number>(), news: () => null, recent: () => [], predicted: () => null, sheets: new Map([["h", side("h", [])], ["w", side("w", XI)]]) });
    expect(empty).toEqual([]);
  });

  it("files the first round as first sheets, with no changes and no debuts", () => {
    const ties = facts(new Map());
    expect(sheetsDeck(ties)).toBe("The first line-ups of the season.");
    expect(plainLine(ties[0].home)).toBe("Team h name their first sheet in a 3-4-3.");
  });

  it("counts the round's changes and debuts into the deck, ignoring an empty earlier period", () => {
    const ties = facts(new Map([["h", [side("h", []), side("h", XI.slice(0, 10))]], ["w", [side("w", ["Pickford:G:12", "Haaland:F:11"])]]]));
    expect(sheetsDeck(ties)).toBe("One change and one debut.");
    expect(plainLine(ties[0].home)).toBe("Team h make one change: Watkins comes in.");
  });

  it("names the man left out when a side starts fewer men than last time, and nobody comes in", () => {
    const ties = facts(new Map([["h", [side("h", [...XI, "Eze:M:8"])]], ["w", [side("w", ["Pickford:G:12", "Haaland:F:11"])]]]));
    expect(plainLine(ties[0].home)).toBe("Team h make one change: Eze is left out.");
  });

  it("never calls every side unchanged while one is on its first sheet", () => {
    const ties = facts(new Map([["w", [side("w", ["Pickford:G:12", "Haaland:F:11"])]]]));
    expect(sheetsDeck(ties)).toBe("No changes.");
  });

  it("prints the eleven and the bench from the facts and the desk's line where a paragraph failed", () => {
    const ties = facts(new Map());
    const column = assembleSheets({ gameweek: 6, ties, against: (clubId) => (clubId === 1 ? "EVE (H)" : null), draft: new Map([["w", "Team w start two men."]]) });
    expect(column.headline).toBe("Team news: Gameweek 6");
    expect(column.body).toBe("The deadline has passed. The line-ups, by head-to-head.");
    const [sheet] = column.sheets as StorySheet[];
    expect(sheet.home.line).toBe("Team h name their first sheet in a 3-4-3.");
    expect(sheet.home.xi[0]).toMatchObject({ name: "Raya", slot: "G", against: "EVE (H)" });
    expect(sheet.away.line).toBe("Team w start two men.");
  });
});
