import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { matchupBlock } from "./block";
import { listFaults, type PastProse } from "./listChecks";

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
    expect(faults(["tD1 got 2 on Saturday.", "tD2 got 2 on Saturday as well."])).toEqual(expect.arrayContaining(["send-back: sentences that open on a man and his points", "send-back: two sentences in a row of the same shape"]));
  });

  it("counts the men named and the times a man 'got' points", () => {
    expect(faults(["tG0, tD1, tD2, tD3, tD4 and tM5 all blanked."])).toContain("send-back: more than 5 men in one match-up");
    expect(faults(["Haaland got a goal.", "test2 got close.", "123 got there."])).toContain('send-back: "got" more than 2 times');
  });

  it("sends back a lede that tells no one's story, copies the brief, or gives the score printed above it", () => {
    const lede = (text: string) => listFaults({ paragraphs: [text, CLOSE] }, ctx, 0, "gameweek", matchupBlock(ctx, "gameweek", 1), []).map((f) => f.check);
    expect(lede("It was a gameweek of fine margins.")).toContain("a lede that tells no one's story");
    expect(lede("Haaland (Man City) scored in the 81st minute; without that goal test2 would have won.")).toContain("a lede copied from the brief");
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

  it("sends back a first name the brief never gave", () => {
    const pickford = contextOf(draftSide("test3", 40, eleven("c", { 0: draftMan("Pickford", "G", 7, 90, 0, { club: "Everton", cleanSheets: 1 }) })), draftSide("test4", 30, eleven("f")));
    const said = (line: string) => listFaults({ paragraphs: [line, "test3 go to test2 next on Sunday."] }, pickford, 1, "gameweek", matchupBlock(pickford, "gameweek", 2), []).map((f) => f.check);
    expect(said("Jordan Pickford kept test3 clear on Saturday.")).toContain("a name the brief does not give");
    expect(said("Then Pickford kept test3 clear on Saturday.")).not.toContain("a name the brief does not give");
  });

  it("reads next gameweek's opponents as sides, not figures", () => {
    const page = listFaults({ paragraphs: [LEDE, "test2 fall to third and face test3 on Sunday; 123 go to test4."] }, ctx, 1, "gameweek", matchupBlock(ctx, "gameweek", 2), [], ["test3", "test4"]).map((f) => f.check);
    expect(page).not.toContain("a roll-call of men and points in one sentence");
  });

  it("only warns when a report never says when, or ends on a man's points", () => {
    const flat = listFaults({ paragraphs: ["Haaland's goal broke test2.", "It was close."] }, ctx, 1, "gameweek", "", []);
    expect(flat.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["no arc: it never says when"]);
    const ending = listFaults({ paragraphs: [LEDE, "Haaland got 6."] }, ctx, 1, "gameweek", "", []);
    expect(ending.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["ends on a man's points, not looking out"]);
  });
});
