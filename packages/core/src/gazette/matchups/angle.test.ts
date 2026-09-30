import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { benchTurned, lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { worthOf } from "./__fixtures__/worth";
import { judgePage, pickAngle, type AngleRecord } from "./angle";
import { thread } from "./thread";
import { threadsOf } from "./threads";

const angleOf = (ctx = lateDecider(), past: AngleRecord[] = [], cutoff: "saturday" | "gameweek" = "gameweek") => pickAngle(ctx, threadsOf(ctx, cutoff, worthOf(), 5), past);

describe("pickAngle", () => {
  it("tells GW5's late decider with the fightback as its twist, and the bench's turn with the lead it cost", () => {
    const late = angleOf();
    expect([late?.story.kind, late?.twist?.kind, late?.cast.map((m) => m.name)[0]]).toEqual(["late-decider", "fightback-short", "Haaland"]);
    const bench = angleOf(benchTurned());
    expect([bench?.story.kind, bench?.twist?.kind, bench?.cast.map((m) => m.name).slice(0, 2)]).toEqual(["bench-turned", "lead-lost", ["Vuskovic", "Janelt"]]);
  });

  it("after Saturday, leads on the man who built the lead, with the reserve waiting on his match as the twist", () => {
    const angle = angleOf(saturdayLead(), [], "saturday");
    expect([angle?.story.kind, angle?.story.men[0]?.name, angle?.twist?.kind]).toEqual(["haul", "Groß", "subs-waiting"]);
  });

  it("does not tell a side's story the same way twice running", () => {
    const past: AngleRecord[] = [{ kind: "late-decider", family: "decider", teamIds: ["test2", "123"], cast: ["Haaland"] }];
    expect(angleOf(lateDecider(), past)?.story.kind).toBe("close");
  });

  it("gives a family already leading the page way to another within fifteen, and keeps one far ahead", () => {
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { angle: null });
    const star = thread("haul", { teamId: "A", facts: [], weight: 50 });
    expect(pickAngle(ctx, [star, thread("late-goal", { teamId: "A", facts: [], weight: 40 })], [], new Set(["star"]))?.story.kind).toBe("late-goal");
    expect(pickAngle(ctx, [star, thread("late-goal", { teamId: "A", facts: [], weight: 30 })], [], new Set(["star"]))?.story.kind).toBe("haul");
  });

  it("finds the other side a place, and casts its top scorer", () => {
    const hall = draftMan("Hall", "D", 8, 90, 0, { club: "Newcastle" });
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a", { 1: hall })), { angle: null });
    const ours = ["haul", "late-goal", "debut", "club-mates"] as const;
    const threads = [...ours.map((kind, i) => thread(kind, { teamId: "A", facts: [], weight: 80 - i * 10 })), thread("early-off", { teamId: "B", facts: [], weight: 30 })];
    const angle = pickAngle(ctx, threads, []);
    expect(angle?.supporting.map((t) => t.kind)).toEqual(["late-goal", "debut", "early-off"]);
    expect(angle?.cast.map((m) => m.name)).toContain("Hall");
  });
});

describe("judgePage", () => {
  it("leads with the strongest story", () => {
    const [late, bench] = [lateDecider(), benchTurned()];
    const page = judgePage([late, bench].map((ctx) => ({ ctx, threads: threadsOf(ctx, "gameweek", worthOf(), 5) })), []);
    expect(page.map((c) => c.angle?.story.kind)).toEqual(["bench-turned", "late-decider"]);
  });
});
