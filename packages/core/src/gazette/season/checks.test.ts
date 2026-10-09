import { describe, expect, it } from "vitest";
import type { CheckContext } from "../predictions/checks";
import { LAWRO_CORE } from "../predictions/past";
import { buildSeasonBrief } from "./brief";
import { seasonCalls, type SeasonCalls } from "./calls";
import { checkSeason, lineKey, type SeasonDraft } from "./checks";
import { PLAYED, SQUADS, man } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, []) as SeasonCalls;
const slotName = (slot: string) => ({ G: "the goalkeeper", D: "the defenders", M: "the midfielders", F: "the forwards" })[slot] ?? slot;
const brief = buildSeasonBrief({ calls, locksAt: "2026-10-10T11:15:00.000Z", slotName });
const names = [...calls.sides.map((side) => side.name), ...[...SQUADS.values()].flat().flatMap((man) => [man.name, man.name.split(" ").at(-1) ?? man.name])];
const ctx: CheckContext = { calls: [], name: (id) => id, facts: [brief, LAWRO_CORE, "Lawro"].join("\n"), offered: [], names, past: [] };
const squads = new Map([...SQUADS].map(([teamId, men]) => [teamId, men.flatMap((man) => [man.name, man.name.split(" ").at(-1) ?? man.name])]));

const clean: SeasonDraft = {
  deck: "Lawro rates the Albion squad the strongest and the Rovers squad the weakest.",
  opening: "I did twenty-two years of this on the BBC, and now it is draft squads. Albion have the strongest of them and Rovers the weakest.",
  table: new Map([
    ["a", "Haaland carries the goals here. The goalkeeper is the weakest in the league, and that will cost them."],
    ["u", "Fernandes is injured, which is a poor way to begin for a side built round him."],
    ["c", "Salah gives them a chance every week. Their midfield is the softest of the lot."],
    ["r", "No forwards worth the name, so Isak will be lonely up there."],
  ]),
};
const faults = (draft: SeasonDraft) => checkSeason(draft, calls, squads, ctx).filter((fault) => fault.severity !== "warn");
const line = (teamId: string, text: string): SeasonDraft => ({ ...clean, table: new Map([...clean.table, [teamId, text]]) });

describe("checkSeason", () => {
  it("passes rankings that keep every side where the desk put it", () => {
    expect(faults(clean)).toEqual([]);
  });

  it("refuses a number the desk did not give a side, and lets the right one stand", () => {
    expect(faults(line("a", "Ranked second, with Haaland, and still short of a goalkeeper."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "a place the desk did not give", severity: "hard" }));
    expect(faults({ ...clean, opening: "Twenty-two years on the BBC, and now this. Rovers are top of the pile, somehow." })).toContainEqual(expect.objectContaining({ check: "a place the desk did not give", evidence: "Rovers: top of the pile" }));
    expect(faults({ ...clean, deck: "Lawro puts Albion in at number two." })).toContainEqual(expect.objectContaining({ section: "deck", check: "a place the desk did not give" }));
    expect(faults(line("a", "Haaland puts them top of the pile, goalkeeper or not."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
    expect(faults(line("c", "Salah is a proper number nine for them. Their midfield is soft."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
  });

  it("holds a squad called the strongest or the weakest to the top or the foot of the rankings", () => {
    expect(faults(line("c", "The weakest squad in the league, and Salah knows it."))).toContainEqual(expect.objectContaining({ section: lineKey("c"), check: "a place the desk did not give", evidence: "City: weakest squad" }));
    expect(faults(line("r", "The weakest squad in the league, and Isak knows it."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
    expect(faults(line("c", "The weakest squad bar one, and Salah knows it."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
    expect(faults(line("u", "The second-best squad, with Fernandes injured."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
  });

  it("reads a place denied, or one counted from another, as no place", () => {
    const place = (text: string) => faults(line("u", text)).filter((fault) => fault.check === "a place the desk did not give");
    for (const text of ["Not the strongest squad, but Palmer gives them a chance.", "The next best side, and Palmer gives them a chance.", "They aren't the strongest squad, and Palmer knows it."]) {
      expect(place(text)).toEqual([]);
    }
    expect(place("The strongest side, and Palmer gives them a chance.")).toContainEqual(expect.objectContaining({ evidence: "United: strongest side" }));
  });

  it("checks every place against the printed order, the editor's moves included", () => {
    const moved = seasonCalls(PLAYED, SQUADS, [{ teamId: "r", place: 3, by: "Craig", on: "2026-10-05", said: "put Rovers 3rd" }]) as SeasonCalls;
    const printed = { ...clean, opening: "I did twenty-two years of this on the BBC, and now it is draft squads. Albion are strongest and City the weakest." };
    const against = (draft: SeasonDraft) => checkSeason(draft, moved, squads, ctx).filter((fault) => fault.severity !== "warn");
    expect(against({ ...printed, table: new Map([...printed.table, ["c", "The weakest squad of the ten, and Salah knows it."]]) })).toEqual([]);
    expect(against({ ...printed, table: new Map([...printed.table, ["r", "The weakest squad in the league, and Isak knows it."]]) })).toContainEqual(
      expect.objectContaining({ section: lineKey("r"), check: "a place the desk did not give", evidence: "Rovers: weakest squad" }),
    );
    expect(against(clean)).toContainEqual(expect.objectContaining({ section: "opening", check: "names a side the desk did not put here", evidence: "Rovers" }));
  });

  it("sends back every word of how a season ends, wherever it is written", () => {
    const forecast = "Albion finish top and take the title, the £30 and a semi. Rovers get the wooden spoon, and United play-in.";
    const found = faults({ ...clean, opening: forecast }).filter((fault) => fault.check === "banned").map((fault) => fault.evidence.toLowerCase());
    for (const word of ["finish", "title", "£", "semi", "wooden spoon", "play-in"]) expect(found).toContain(word);
    expect(faults({ ...clean, deck: "Lawro's predicted table has Albion in the playoffs." }).map((fault) => fault.evidence.toLowerCase())).toEqual(expect.arrayContaining(["predicted", "playoffs"]));
  });

  it("keeps a side's line to its own side and its own men", () => {
    expect(faults(line("a", "Haaland will outscore Rovers on his own."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "names another side" }));
    expect(faults(line("a", "Haaland and Salah would be a side."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "a man from another squad", severity: "hard" }));
  });

  it("reads a man's own name whole, so his first name is not another squad's surname", () => {
    const spoken = (name: string) => [name, name.split(" ").at(-1) ?? name];
    const held = new Map(SQUADS).set("u", [man("u1", "James Maddison", "Tottenham Hotspur", 180, 1), man("u2", "Cole Palmer", "Chelsea", 170, 6)]).set("c", [man("c1", "Reece James", "Chelsea", 190, 3)]);
    const named = new Map([...held].map(([teamId, men]) => [teamId, men.flatMap((each) => spoken(each.name))]));
    const strangers = (text: string) => checkSeason(line("u", text), calls, named, ctx).filter((fault) => fault.check === "a man from another squad").map((fault) => fault.evidence);
    expect(strangers("James Maddison carries them, and I have seen worse.")).toEqual([]);
    expect(strangers("Reece James would help them.")).toEqual(["Reece James", "James"]);
  });

  it("keeps the opening to two or three sentences, naming only the strongest and the weakest", () => {
    expect(faults({ ...clean, opening: "Twenty-two years on the BBC, and now this." })).toContainEqual(expect.objectContaining({ section: "opening", check: "length" }));
    expect(faults({ ...clean, opening: "Twenty-two years on the BBC, and now this. City are the ones I would watch." })).toContainEqual(expect.objectContaining({ section: "opening", check: "names a side the desk did not put here", evidence: "City" }));
  });

  it("files the opening's word cap under the opening, the section he wrote", () => {
    const opening = "I did twenty-two years of this on the BBC, and now it is draft squads in a paper nobody buys, which is about right for me. Albion have the strongest squad of them all and Rovers have the weakest one of the lot by a distance. That is my lot.";
    const length = faults({ ...clean, opening }).filter((fault) => fault.check === "length").map((fault) => `${fault.section}: ${fault.evidence}`);
    expect(length).toEqual(["opening: 3 sentences, 50 words"]);
  });

  it("sends back the source, the machine, the draft's rounds and American English", () => {
    const found = faults(line("c", "The FPL simulation rates Salah, taken in the third round, my favorite."));
    for (const word of ["FPL", "simulation", "round"]) expect(found.some((fault) => fault.check === "banned" && fault.evidence.toLowerCase().includes(word.toLowerCase()))).toBe(true);
    expect(found).toContainEqual(expect.objectContaining({ check: "not British football English", evidence: "favorite" }));
  });

  it("sends back ten lines that open alike or echo one another", () => {
    const alike = { ...clean, table: new Map([...clean.table, ["c", "Salah is a worry for me."], ["r", "Isak is a worry for me too."]]) };
    expect(faults(alike)).toContainEqual(expect.objectContaining({ check: "the same phrase as another tie" }));
    expect(faults(line("r", "Fernandes is not theirs, but no forwards worth the name."))).toContainEqual(expect.objectContaining({ check: "opens like another side's line" }));
  });

  it("holds a line to two sentences, his short kicker on the end aside", () => {
    expect(faults(line("c", "Salah gives them a chance every week. Their midfield is the softest of the lot. Lovely."))).toEqual([]);
    expect(faults(line("c", "Salah gives them a chance. Their midfield is soft. It will cost them dear all winter."))).toContainEqual(expect.objectContaining({ section: lineKey("c"), check: "length" }));
  });

  it("refuses a side with no line and an empty opening", () => {
    const gone = { ...clean, opening: "", table: new Map([...clean.table].filter(([teamId]) => teamId !== "c")) };
    expect(faults(gone)).toEqual(expect.arrayContaining([expect.objectContaining({ section: "opening", check: "missing" }), expect.objectContaining({ section: lineKey("c"), check: "missing" })]));
  });
});
