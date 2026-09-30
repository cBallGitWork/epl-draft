import { describe, expect, it } from "vitest";
import { worthOf } from "./__fixtures__/worth";
import { benchTurned, lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { pickAngle } from "./angle";
import { thread } from "./thread";
import { buildDraftBrief } from "./brief";
import { threadsOf } from "./threads";

const end = buildDraftBrief("gameweek", 5, [lateDecider(), benchTurned()]);
const saturday = buildDraftBrief("saturday", 5, [saturdayLead()]);

describe("buildDraftBrief", () => {
  it("never names a provider, a projection or an analyst's term", () => {
    for (const brief of [end, saturday]) for (const label of [/Fantrax/i, /\bFPL\b/, /project/i, /expected/i, /\bxG\b/, /%/, /\bbonus\b/i, /\brank\b/i]) expect(brief).not.toMatch(label);
  });

  it("builds each match-up on the desk's story: the result printed above, THE STORY for the lede, the twist, the cast", () => {
    expect(end).toContain("MATCH-UP 1: test2 v 123, THE LEAD");
    expect(end).toContain("THE RESULT, printed above your words, never in them: 123 beat test2 38-37.");
    expect(end).toContain("THE STORY, which your first sentence tells: 123: Haaland of Man City scored in the 81st minute; without that goal test2 would have won (Sunday)");
    expect(end).toContain("THE TWIST, told in its beat: test2 were 11 behind after Friday and lost by 1 (Friday)");
    expect(end).toContain("THE CAST, each man's points given once:\n- 123's Haaland of Man City, on Sunday: 6 points: a goal in the 81st minute");
  });

  it("tells how it unfolded a day at a time, returns without their points, and marks no day as optional", () => {
    expect(end).toContain("HOW IT UNFOLDED, in order:\n- Friday: test2 0, 123 11, making it 11-0 to 123");
    expect(end).toContain("- Sunday: test2 18, 123 12, making it 38-34 to 123, the gap down from 10 to 4; returns: 123's Haaland of Man City (a goal in the 81st minute)");
    expect(end).toContain("- Friday: test2 0, 123 11, making it 11-0 to 123; no returns, the points all for minutes and defensive work\n");
    expect(end).toContain("- The automatic substitutions: test2 3, 123 0, making it 38-37 to 123, the gap down from 4 to 1; no returns, the points all for minutes and defensive work");
    expect(end).not.toMatch(/left out/u);
    expect(end).toContain("- The automatic substitutions: test4 2, test3 9, making it 33-28 to test3, the lead passing from test4 to test3; returns: test3's Vuskovic of Tottenham (a clean sheet)");
  });

  it("names every return in a day with its side, and never its points", () => {
    const saka = draftMan("Saka", "M", 8, 90, 0, { club: "Arsenal", goals: 1 });
    const rice = draftMan("Rice", "M", 5, 90, 0, { club: "Arsenal", assists: 1 });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 5: saka })), draftSide("B", 30, eleven("a", { 6: rice })));
    const angle = { story: thread("haul", { teamId: "A", men: [saka], facts: ["Saka scored"] }), twist: null, supporting: [], cast: [saka], score: 45, past: [] };
    expect(buildDraftBrief("gameweek", 5, [{ ...ctx, angle }])).toContain("returns: A's Saka of Arsenal (a goal) and B's Rice of Arsenal (an assist)");
  });

  it("after Saturday, says how it stands and what is still to come, the shared match first, as fixtures only", () => {
    expect(saturday).toContain("THE SCORE after Saturday's matches, printed above your words, never in them: 123 lead test2 26-16.");
    expect(saturday).toContain("STILL TO COME, the fixtures only:\n- Man City v Sunderland, Sunday: Hume of Sunderland and Haaland of Man City for 123; Meunier of Sunderland (if he plays) for test2");
    expect(saturday).toContain("- On Sunday, in other matches, 1 more of 123's men and 2 more of test2's men play");
    expect(saturday).not.toContain("NEXT GAMEWEEK");
  });

  it("names the side a thread is about, so one side's blanks are never given to the other", () => {
    const arsenal = { 6: draftMan("Rice", "M", 1, 90, 0, { club: "Arsenal" }), 9: draftMan("Havertz", "F", 2, 90, 0, { club: "Arsenal" }) };
    const ctx = contextOf(draftSide("test2", 30, eleven("t", arsenal)), draftSide("123", 40, eleven("o")));
    expect(buildDraftBrief("gameweek", 5, [ctx])).toContain("test2: two Arsenal men, Rice and Havertz, both blanked (Saturday)");
  });

  it("leaves out where the sides stood, which the form strip prints, and meetings that are no thread", () => {
    expect(end).not.toMatch(/WHERE THEY STAND|THE MEETINGS/u);
  });

  it("says where each side goes next once the gameweek is done, and what each told last time", () => {
    const ctx = lateDecider();
    const angle = pickAngle(ctx, threadsOf(ctx, "gameweek", worthOf(), 5), [{ kind: "late-decider", family: "decider", teamIds: ["123", "test9"], cast: ["Haaland"] }]);
    const next = { home: { name: "test3", rank: 1 }, away: { name: "test4", rank: null } };
    const brief = buildDraftBrief("gameweek", 5, [{ ...ctx, angle, next }]);
    expect(brief).toContain("NEXT GAMEWEEK, for a last line that looks out:\n- test2 play test3, who are 1st after this gameweek\n- 123 play test4");
    expect(brief).toContain("LAST TIME, not to be told the same way again:\n- 123: a late decider, told through Haaland");
  });
});
