import { describe, expect, it } from "vitest";
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

  it("only warns when a report never says when, or ends on a man's points", () => {
    const flat = listFaults({ paragraphs: ["Haaland's goal broke test2.", "It was close."] }, ctx, 1, "gameweek", "", []);
    expect(flat.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["no arc: it never says when"]);
    const ending = listFaults({ paragraphs: [LEDE, "Haaland got 6."] }, ctx, 1, "gameweek", "", []);
    expect(ending.filter((f) => f.severity === "warn").map((f) => f.check)).toEqual(["ends on a man's points, not looking out"]);
  });
});
