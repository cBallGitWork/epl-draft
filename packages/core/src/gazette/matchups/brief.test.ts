import { describe, expect, it } from "vitest";
import { worthOf } from "./__fixtures__/worth";
import { benchTurned, lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { pickAngle } from "./angle";
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
    expect(end).toContain("THE STORY, which your first sentence tells: Haaland (Man City) scored in the 81st minute; without that goal test2 would have won (Sunday)");
    expect(end).toContain("THE TWIST, told in its beat: test2 were 11 behind after Friday and lost by 1 (Friday)");
    expect(end).toContain("THE CAST, each man's points given once:\n- Haaland (Man City) for 123: 6 points: a goal in the 81st minute (Sunday)");
  });

  it("tells how it unfolded a day at a time, returns without their points, and lets a quiet day go", () => {
    expect(end).toContain("HOW IT UNFOLDED, in order:\n- Friday: test2 0, 123 11, making it 11-0 to 123");
    expect(end).toContain("- Sunday: test2 18, 123 12, making it 38-34 to 123; returns: Haaland (a goal in the 81st minute) for 123");
    expect(end).toContain("- The substitutions, may be left out: test2 3, 123 0, making it 38-37 to 123");
    expect(end).toContain("- The substitutions: test4 2, test3 9, making it 33-28 to test3; returns: Vuskovic (a clean sheet) for test3");
  });

  it("after Saturday, says how it stands and what is still to come, the shared match first, as fixtures only", () => {
    expect(saturday).toContain("THE SCORE after Saturday's matches, printed above your words, never in them: 123 lead test2 26-16.");
    expect(saturday).toContain("STILL TO COME, the fixtures only:\n- Man City v Sunderland, Sunday: Hume and Haaland for 123; Meunier (if he plays) for test2");
    expect(saturday).not.toContain("NEXT GAMEWEEK");
  });

  it("leaves out where the sides stood, which the form strip prints, and meetings that are no thread", () => {
    expect(end).not.toMatch(/WHERE THEY STAND|THE MEETINGS/u);
  });

  it("says where each side goes next once the gameweek is done, and what each told last time", () => {
    const ctx = lateDecider();
    const angle = pickAngle(ctx, threadsOf(ctx, "gameweek", worthOf(), 5), [{ kind: "late-decider", family: "decider", teamIds: ["123", "test9"], cast: ["Haaland"] }]);
    const next = { home: { name: "test3", rank: 1 }, away: { name: "test4", rank: null } };
    const brief = buildDraftBrief("gameweek", 5, [{ ...ctx, angle, next }]);
    expect(brief).toContain("NEXT GAMEWEEK, may be left out:\n- test2 play test3, 1st after this gameweek\n- 123 play test4");
    expect(brief).toContain("LAST TIME, not to be told the same way again:\n- 123: a late decider, told through Haaland");
  });
});
