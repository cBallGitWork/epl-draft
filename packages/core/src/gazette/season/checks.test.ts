import { describe, expect, it } from "vitest";
import type { CheckContext } from "../predictions/checks";
import { LAWRO_CORE } from "../predictions/past";
import { buildSeasonBrief } from "./brief";
import { seasonCalls, type SeasonCalls } from "./calls";
import { checkSeason, lineKey, type SeasonDraft } from "./checks";
import { PLAYED, SQUADS } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, 2) as SeasonCalls;
const slotName = (slot: string) => ({ G: "the goalkeeper", D: "the defenders", M: "the midfielders", F: "the forwards" })[slot] ?? slot;
const brief = buildSeasonBrief({ calls, schedule: { from: 6, to: 34, empty: [], doubles: [], places: 2 }, locksAt: "2026-10-10T11:15:00.000Z", slotName });
const names = [...calls.sides.map((side) => side.name), ...[...SQUADS.values()].flat().flatMap((man) => [man.name, man.name.split(" ").at(-1) ?? man.name])];
const ctx: CheckContext = { calls: [], name: (id) => id, facts: [brief, LAWRO_CORE, "Lawro"].join("\n"), offered: [], names, past: [] };
const squads = new Map([...SQUADS].map(([teamId, men]) => [teamId, men.flatMap((man) => [man.name, man.name.split(" ").at(-1) ?? man.name])]));

const clean: SeasonDraft = {
  deck: "Lawro has Albion as champions and Rovers bottom, and a steal from late in the draft.",
  opening: "I did twenty-two years of this on the BBC, and now it is draft squads. Albion are the only side clear of the pack.",
  title: "Albion win it, because their defenders are the best around. United get nearest and still fall a long way short.",
  playoffs: "Albion and United take the playoff places. City miss out, and I will not lose sleep over it.",
  spoon: "Rovers get the wooden spoon. Isak cannot do it on his own. City are above them and look relieved.",
  bold: "Saka, taken seventh, will outscore every one of the first four men taken. Albion got a steal there.",
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
  it("passes a column that keeps every call where the desk made it", () => {
    expect(faults(clean)).toEqual([]);
  });

  it("refuses a place the desk did not give a side, and lets the right one stand", () => {
    expect(faults(line("a", "Albion finish second, and Haaland will not save them."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "a place the desk did not give", severity: "hard" }));
    expect(faults({ ...clean, spoon: "City come last, with Isak on his own. Rovers are above them." })).toContainEqual(expect.objectContaining({ check: "a place the desk did not give", evidence: "City: come last" }));
    expect(faults(line("a", "Albion finish top, and Haaland is why."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
    expect(faults(line("u", "United finish in the top two, Fernandes or not."))).not.toContainEqual(expect.objectContaining({ check: "a place the desk did not give" }));
  });

  it("keeps a side's line to its own side and its own men", () => {
    expect(faults(line("a", "Haaland will outscore Rovers on his own."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "names another side" }));
    expect(faults(line("a", "Haaland and Salah would be a side."))).toContainEqual(expect.objectContaining({ section: lineKey("a"), check: "a man from another squad", severity: "hard" }));
  });

  it("names who each paragraph is about, and only them", () => {
    expect(faults({ ...clean, playoffs: "Albion take a playoff place. City miss out." })).toContainEqual(expect.objectContaining({ section: "playoffs", check: "leaves out a side it is about", evidence: "United" }));
    expect(faults({ ...clean, title: "Albion win it. Rovers will not." })).toContainEqual(expect.objectContaining({ section: "title", check: "names a side the desk did not put here", evidence: "Rovers" }));
  });

  it("sends back the source, the machine, the draft's rounds and American English", () => {
    const found = faults({ ...clean, bold: "The FPL simulation says Saka, taken in the seventh round, is my favorite." });
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
    expect(faults(line("c", "Salah gives them a chance. Their midfield is soft. It will cost them dear in May."))).toContainEqual(expect.objectContaining({ section: lineKey("c"), check: "length" }));
  });

  it("refuses a side with no line and a paragraph left empty", () => {
    const gone = { ...clean, bold: "", table: new Map([...clean.table].filter(([teamId]) => teamId !== "c")) };
    expect(faults(gone)).toEqual(expect.arrayContaining([expect.objectContaining({ section: "bold", check: "missing" }), expect.objectContaining({ section: lineKey("c"), check: "missing" })]));
  });
});
