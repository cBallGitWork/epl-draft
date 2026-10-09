import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { matchupBlock } from "./block";
import { listFaults, unbriefedNames, type PastProse } from "./listChecks";

const ctx = lateDecider();
const LEDE = "Haaland's goal nine minutes from time broke test2 on Sunday.";
const CLOSE = "Next gameweek test2 go to the leaders.";
const faults = (body: string[], at = 1, past: PastProse[] = [], context = ctx, cutoff: "saturday" | "gameweek" = "gameweek") =>
  listFaults({ paragraphs: [LEDE, ...body, CLOSE] }, context, at, cutoff, matchupBlock(context, cutoff, at + 1), past).map((f) => `${f.severity}: ${f.check}`);

describe("listFaults", () => {
  it("passes a report that tells a story", () => {
    expect(faults(["test2 had clawed back from 11 down by Saturday night.", "Then the substitutions changed nothing, and Haaland's strike stood."])).toEqual([]);
  });

  it("sends back a roll-call: men and points in one sentence, sentences opening on a man and his points, one shape twice", () => {
    expect(faults(["tG0 got 2, tD1 got 2 and tD2 got 2."])).toContain("send-back: a roll-call of men and points in one sentence");
    expect(faults(["tD1 got 2 on Saturday.", "tD2 got 2 on Saturday as well."])).toContain("send-back: two sentences in a row of the same shape");
    expect(faults(["Gross scored 11 points thanks to a goal and an assist on Saturday."])).not.toContain("send-back: two sentences in a row of the same shape");
  });

  it("sends back a haul of one return", () => {
    const hall = contextOf(draftSide("test2", 30, eleven("t", { 1: draftMan("Hall", "D", 8, 90, 0, { club: "Newcastle", goals: 1 }) })), draftSide("123", 40, eleven("o")));
    const said = (line: string) => listFaults({ paragraphs: [line, "test2 go to test3 next on Sunday."] }, hall, 1, "gameweek", matchupBlock(hall, "gameweek", 2), []).map((f) => f.check);
    expect(said("Hall's goal was an eight-point haul on Saturday.")).toContain("a haul is more than one return");
    expect(said("Hall scored for eight points on Saturday.")).not.toContain("a haul is more than one return");
  });

  it("counts the men named, and sends back a score told twice", () => {
    expect(faults(["tG0, tD1, tD2, tD3, tD4 and tM5 all blanked."])).toContain("send-back: more than 5 men in one match-up");
    expect(faults(["123 led 26-16 after Saturday.", "It was still 26-16 when Sunday began."])).toContain("send-back: the same score told twice");
  });

  it("sends back a lede that tells no one's story, copies the brief, or gives the score printed above it", () => {
    const lede = (text: string) => listFaults({ paragraphs: [text, CLOSE] }, ctx, 0, "gameweek", matchupBlock(ctx, "gameweek", 1), []).map((f) => f.check);
    expect(lede("It was a gameweek of fine margins.")).toContain("a lede that tells no one's story");
    expect(lede("Haaland scored in the 81st minute; without that goal test2 would have won.")).toContain("a lede copied from the brief");
    expect(lede("Haaland made it 38-37 for 123.")).toContain("a lede that gives the score printed above it");
  });

  it("sends back a body that goes back to an earlier day", () => {
    expect(faults(["Haaland struck late on Sunday.", "Before that tD1 had kept test2 in it."])).toContain("send-back: goes back to an earlier day");
  });

  it("after Saturday, sends back a forecast but lets a fixture keep its future tense", () => {
    const sat = saturdayLead();
    const said = (line: string) => listFaults({ paragraphs: ["Groß put 123 ten clear.", line, CLOSE] }, sat, 0, "saturday", matchupBlock(sat, "saturday", 1), []).map((f) => f.check);
    expect(said("Haaland might settle it.")).toContain("a forecast after Saturday: the future is for fixtures only");
    expect(said("Man City will host Sunderland on Sunday.")).not.toContain("a forecast after Saturday: the future is for fixtures only");
  });

  it("sends back a phrase from these sides' last report, but not one the brief handed over", () => {
    const past = [{ teamIds: ["123"], prose: "The bench carried them over the line in the end." }];
    expect(faults(["The bench carried them over the line again."], 1, past)).toContain("send-back: a phrase from these sides' last report");
    expect(faults(["The bench carried them over the line again."], 1, [{ teamIds: ["test9"], prose: past[0].prose }])).not.toContain("send-back: a phrase from these sides' last report");
  });

  it("sends back a man's points misstated, but not a gap given in points", () => {
    const gray = contextOf(draftSide("test4", 30, eleven("f", { 6: draftMan("Gray", "M", 2, 71, 0, { club: "Spurs", started: false }) })), draftSide("test3", 40, eleven("c")));
    const said = (line: string) => listFaults({ paragraphs: ["test3 kept test4 at arm's length on Sunday.", line, "test3 go to test2 next."] }, gray, 1, "gameweek", matchupBlock(gray, "gameweek", 2), []).map((f) => f.check);
    expect(said("Gray played 71 minutes for a single point.")).toContain("a man's points misstated");
    expect(said("Gray played 71 minutes for two points.")).not.toContain("a man's points misstated");
    expect(said("Gray played on as test4 fell behind by ten points.")).not.toContain("a man's points misstated");
  });

  it("fails a man keeping his own club out", () => {
    const justin = contextOf(draftSide("test4", 30, eleven("f", { 1: draftMan("Justin", "D", 6, 90, 0, { club: "Leeds", cleanSheets: 1 }) })), draftSide("test3", 40, eleven("c")));
    const said = (line: string) => listFaults({ paragraphs: [line, "test3 go to test2 next on Sunday."] }, justin, 1, "gameweek", matchupBlock(justin, "gameweek", 2), []).map((f) => `${f.severity}: ${f.check}`);
    expect(said("Justin keeping Leeds out gave test4 Sunday.")).toContain("hard: a man keeping his own club out");
    expect(said("Justin kept a clean sheet for Leeds on Sunday.")).not.toContain("hard: a man keeping his own club out");
  });

  it("sends back a first name the brief never gave", () => {
    const pickford = contextOf(draftSide("test3", 40, eleven("c", { 0: draftMan("Pickford", "G", 7, 90, 0, { club: "Everton", cleanSheets: 1 }) })), draftSide("test4", 30, eleven("f")));
    const said = (line: string) => listFaults({ paragraphs: [line, "test3 go to test2 next on Sunday."] }, pickford, 1, "gameweek", matchupBlock(pickford, "gameweek", 2), []).map((f) => `${f.severity}: ${f.check}`);
    expect(said("Jordan Pickford kept test3 clear on Saturday.")).toContain("hard: a name the brief does not give");
    expect(said("Then Pickford kept test3 clear on Saturday.")).not.toContain("hard: a name the brief does not give");
  });

  it("reads next gameweek's opponents as sides, not figures", () => {
    const page = listFaults({ paragraphs: [LEDE, "test2 fall to third and face test3 on Sunday; 123 go to test4."] }, ctx, 1, "gameweek", matchupBlock(ctx, "gameweek", 2), [], ["test3", "test4"]).map((f) => f.check);
    expect(page).not.toContain("a roll-call of men and points in one sentence");
  });

  it("reads a man keeping his own club out in one sentence, about him", () => {
    const pickford = draftMan("Pickford", "G", 6, 90, 0, { club: "Everton", cleanSheets: 1 });
    const saka = draftMan("Saka", "M", 2, 90, 0, { club: "Arsenal" });
    const ctx2 = contextOf(draftSide("Dons", 26, eleven("h", { 0: pickford })), draftSide("Rovers", 22, eleven("a", { 5: saka })));
    const own = (line: string) => listFaults({ paragraphs: [line] }, ctx2, 0, "gameweek", "", []).filter((f) => f.check === "a man keeping his own club out");
    expect(own("Pickford kept Arsenal out on Saturday. Saka blanked for Rovers on Saturday.")).toEqual([]);
    expect(own("Saka kept Arsenal out on Saturday.")).toHaveLength(1);
  });

  it("lets the brief's own keeper's haul and lost clean sheet stand", () => {
    const pickford = (points: number, over = {}) => draftMan("Pickford", "G", points, 90, 0, { club: "Everton", ...over });
    const told = (man: ReturnType<typeof draftMan>, line: string) => {
      const keeper = contextOf(draftSide("Dons", 20 + (man.points ?? 0), eleven("h", { 0: man })), draftSide("Rovers", 22, eleven("a")));
      return listFaults({ paragraphs: [line] }, keeper, 0, "gameweek", matchupBlock(keeper, "gameweek", 1), []).map((f) => f.check);
    };
    expect(told(pickford(9, { cleanSheets: 1 }), "Pickford hauled 9 in goal on Saturday.")).not.toContain("a haul is more than one return");
    expect(told(pickford(3, { concededFirstAt: [goalAt(88)] }), "Pickford lost a clean sheet worth 4 points to a goal in the 88th minute on Saturday.")).not.toContain("a man's points misstated");
  });

  it("never reads an adverb opening a sentence as a first name from memory", () => {
    const block = matchupBlock(ctx, "gameweek", 1);
    for (const line of ["Twice Haaland went close on Sunday.", "Late Haaland struck on Sunday.", "Finally Haaland scored on Sunday."]) expect(unbriefedNames(line, ctx, block)).toEqual([]);
    expect(unbriefedNames("Erling Haaland struck on Sunday.", ctx, block)).toEqual(["Erling"]);
  });

  it("sends back a report that leaves out automatic substitutions that changed the score", () => {
    const told = (body: string) => listFaults({ paragraphs: [LEDE, body, CLOSE] }, ctx, 1, "gameweek", matchupBlock(ctx, "gameweek", 2), []).map((f) => f.check);
    expect(told("test2 closed to within four on Sunday.")).toContain("the automatic substitutions go untold");
    expect(told("Meunier's three points closed it to one on Sunday.")).not.toContain("the automatic substitutions go untold");
  });

  it("only warns when a report never says when, or ends on a man's points", () => {
    const flat = listFaults({ paragraphs: ["Haaland's goal broke test2.", "It was close."] }, ctx, 1, "gameweek", "", []);
    expect(flat.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["no arc: it never says when"]);
    const ending = listFaults({ paragraphs: [LEDE, "Haaland got 6."] }, ctx, 1, "gameweek", "", []);
    expect(ending.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["ends on a man's points, not looking out"]);
  });
});
