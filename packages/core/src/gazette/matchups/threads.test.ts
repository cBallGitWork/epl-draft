import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { benchTurned, lateDecider, saturdayLead } from "./__fixtures__/gw5";
import { worthOf } from "./__fixtures__/worth";
import { threadsOf } from "./threads";

const kinds = (ctx = lateDecider(), cutoff: "saturday" | "gameweek" = "gameweek", gameweek = 5) => threadsOf(ctx, cutoff, worthOf(), gameweek);

describe("threadsOf", () => {
  it("finds GW5's late decider, decisive, and test2's fightback that fell one short", () => {
    const threads = kinds();
    expect(threads.find((t) => t.kind === "late-decider")).toMatchObject({ weight: 110, decisive: true, men: [{ name: "Haaland" }] });
    expect(threads.find((t) => t.kind === "fightback-short")?.facts).toEqual(["test2 were 11 behind after Friday and lost by 1"]);
    expect(threads.map((t) => t.kind)).not.toContain("late-goal");
  });

  it("finds the bench that turned test4 v test3, and the lead test4 lost with it", () => {
    const threads = kinds(benchTurned());
    expect(threads.find((t) => t.kind === "bench-turned")).toMatchObject({ weight: 120, beat: null, men: [{ name: "Vuskovic" }, { name: "Janelt" }] });
    expect(threads.find((t) => t.kind === "bench-turned")?.facts).toEqual(["test4 led 26-24 before the automatic substitutions, which put Vuskovic in for Dunk and Janelt in for Jensen for test3"]);
    expect(threads.find((t) => t.kind === "lead-lost")?.facts).toEqual(["test4 led by 2 after Sunday"]);
  });

  it("after Saturday, tells what is still to come and credits the man who built the lead", () => {
    const threads = kinds(saturdayLead(), "saturday");
    expect(threads.find((t) => t.kind === "haul")).toMatchObject({ weight: 65, decisive: true });
    expect(threads.find((t) => t.kind === "subs-waiting")?.facts).toEqual(["Millar did not play, so Meunier comes on if he plays"]);
    expect(threads.find((t) => t.kind === "saturday-lead")?.facts).toEqual(["123 lead by 10, 11-0 on Friday and 15-16 on Saturday"]);
    expect(threads.map((t) => t.kind)).not.toContain("late-decider");
  });

  it("hands over the irony of a side that won more of the gameweek's stages and still lost", () => {
    expect(kinds().find((t) => t.kind === "days-won")?.facts).toEqual(["test2 won Saturday, Sunday and the automatic substitutions, 3 of the gameweek's 4 stages, and still lost by 1"]);
  });

  it("tells two sides' men who both returned in the same Premier League match", () => {
    const match = { matches: [{ code: 7, label: "Man City v Sunderland" }] };
    const haaland = draftMan("Haaland", "F", 6, 90, 0, { ...match, club: "Man City", goals: 1 });
    const meunier = draftMan("Meunier", "D", 5, 90, 0, { ...match, club: "Sunderland", assists: 1 });
    const ctx = contextOf(draftSide("123", 40, eleven("o", { 9: haaland })), draftSide("test2", 30, eleven("t", { 1: meunier })));
    expect(kinds(ctx).find((t) => t.kind === "same-match")?.facts).toEqual(["Man City v Sunderland, one match: Haaland (a goal) for 123; Meunier (an assist) for test2"]);
  });

  it("works the side behind's sums once three or fewer are left, and none before", () => {
    const salah = draftMan("Salah", "M", null, 0, 1, { club: "Liverpool", next: { opponent: "Everton", home: false, kickoff: "2026-09-27T15:30:00Z" } });
    const chase = (away: ReturnType<typeof eleven>) => kinds(contextOf(draftSide("Home", 40, eleven("h")), draftSide("Away", 36, away), {}, "saturday"), "saturday").find((t) => t.kind === "chase");
    expect(chase(eleven("a", { 5: salah }))?.facts).toEqual(["a goal from Salah would win it"]);
    const toCome = (tag: string, slot: string) => draftMan(tag, slot, null, 0, 1, { club: `${tag} FC` });
    expect(chase(eleven("a", { 5: salah, 6: toCome("a6", "M"), 7: toCome("a7", "M"), 9: toCome("a9", "F") }))).toBeUndefined();
  });

  it("credits the return after which the winner led for good when nothing later decided it", () => {
    const gross = draftMan("Groß", "M", 11, 90, 0, { club: "Brighton", goals: 1, assists: 1 });
    const ctx = contextOf(draftSide("123", 40, eleven("o", { 8: gross })), draftSide("test2", 30, eleven("t")));
    expect(kinds(ctx).find((t) => t.decisive && t.men[0] === gross)).toMatchObject({ kind: "haul", weight: 45 + 30 });
  });

  it("tells a goal that cost the other side's man his clean sheet, and a star's blank only from gameweek 6", () => {
    const match = { matches: [{ code: 9, label: "Man City v Everton" }] };
    const scorer = draftMan("Haaland", "F", 6, 90, 0, { ...match, club: "Man City", goals: 1, scoredAt: [goalAt(30)], projected: 9 });
    const victim = draftMan("Tarkowski", "D", 2, 90, 0, { ...match, club: "Everton", concededFirstAt: [goalAt(30)] });
    const salah = draftMan("Salah", "M", 2, 90, 0, { club: "Liverpool", projected: 8 });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 9: scorer, 5: salah })), draftSide("B", 30, eleven("a", { 1: victim })));
    expect(kinds(ctx).find((t) => t.kind === "crossfire")?.facts).toEqual(["Haaland scored in the 30th minute, the goal that cost Tarkowski his clean sheet for B"]);
    expect(kinds(ctx, "gameweek", 5).map((t) => t.kind)).not.toContain("star-blank");
    expect(kinds(ctx, "gameweek", 6).find((t) => t.kind === "star-blank")?.men[0]?.name).toBe("Salah");
  });

  it("calls a win from four places lower an upset only from the league's fourth gameweek, whatever the Premier League's", () => {
    const place = (rank: number, played: number) => ({ rank, won: 0, drawn: 0, lost: played, run: "" });
    const upset = (played: number) => kinds(contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { places: { home: place(9, played), away: place(3, played) } }), "gameweek", 7).find((t) => t.kind === "upset");
    expect(upset(1)).toBeUndefined();
    expect(upset(3)?.facts).toEqual(["A were 9th going into the gameweek and B 3rd"]);
  });

  it("keeps the club's word on a man a reserve replaced, and no old boy who never played", () => {
    const out = draftMan("Reinildo", "D", null, 0, 0, { club: "Sunderland", fitness: "Reinildo is available again after his suspension" });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 1: out }), [draftMan("Mukiele", "D", 0, 90, 0, { club: "Sunderland" })]), draftSide("B", 30, eleven("a")), { oldBoys: [{ fantraxId: "Reinildo", line: "Reinildo faced B, who drafted him" }] });
    const threads = kinds(ctx);
    expect(threads.find((t) => t.kind === "injury")?.facts).toEqual(["Reinildo did not play; since: Reinildo is available again after his suspension"]);
    expect(threads.map((t) => t.kind)).not.toContain("old-boy");
  });

  it("weighs a keeper's haul by its size, and a man off the bench more when he returned", () => {
    // Both on the losing side, so neither is the man the winner's lead was built on.
    const keeper = draftMan("Raya", "G", 10, 90, 0, { club: "Arsenal", cleanSheets: 1 });
    const cameo = draftMan("Hemmings", "M", 6, 20, 0, { club: "Aston Villa", started: false, goals: 1 });
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a", { 0: keeper, 5: cameo })));
    expect(kinds(ctx).find((t) => t.kind === "keeper-haul")?.weight).toBe(55);
    expect(kinds(ctx).find((t) => t.kind === "non-starter")?.weight).toBe(45);
  });

  it("gives a double gameweek's points in the house's words, and none when Fantrax has none", () => {
    const twice = (points: number | null) => draftMan("Wissa", "F", points, 1, 0, { played: 2, club: "Newcastle" });
    const double = (points: number | null) => kinds(contextOf(draftSide("Dons", 21, eleven("h", { 10: twice(points) })), draftSide("Rovers", 22, eleven("a")))).find((t) => t.kind === "double")?.facts;
    expect(double(1)).toEqual(["Wissa had two matches this gameweek, for 1 point"]);
    expect(double(null)).toEqual(["Wissa had two matches this gameweek"]);
  });

  it("costs nobody a clean sheet he was not on long enough to keep", () => {
    const kickoff = "2026-09-26T14:00:00Z";
    const match = [{ code: 1, label: "Man City v Sunderland" }];
    const haaland = draftMan("Haaland", "F", 6, 90, 0, { club: "Man City", goals: 1, scoredAt: [goalAt(10, undefined, kickoff)], matches: match });
    const late = draftMan("Mukiele", "D", 1, 20, 0, { club: "Sunderland", concededFirstAt: [goalAt(10, undefined, kickoff)], matches: match });
    const ctx = contextOf(draftSide("Dons", 26, eleven("h", { 10: haaland })), draftSide("Rovers", 21, eleven("a", { 2: late })));
    expect(kinds(ctx).map((t) => t.kind)).not.toContain("crossfire");
  });

  it("files no chase when minutes alone close the gap, so an empty thread never becomes the story", () => {
    const kickoff = "2026-09-27T15:30:00Z";
    const toCome = draftMan("Isak", "F", null, 0, 1, { club: "Liverpool", next: { opponent: "Bournemouth", home: false, kickoff } });
    const ctx = contextOf(draftSide("Dons", 22, eleven("h")), draftSide("Rovers", 20, eleven("a", { 10: toCome })), { angle: null }, "saturday");
    const threads = threadsOf(ctx, "saturday", worthOf(2), 5);
    expect(threads.filter((t) => t.facts.length === 0)).toEqual([]);
  });
});
