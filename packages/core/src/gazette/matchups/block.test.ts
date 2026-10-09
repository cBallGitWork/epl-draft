import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { lateDecider } from "./__fixtures__/gw5";
import { matchupBlock } from "./block";
import { subLine } from "./stories";

const line = (block: string, needle: string) => block.split("\n").find((l) => l.includes(needle)) ?? "";

describe("matchupBlock's cast", () => {
  it("never calls a starter a reserve on the bench when a reserve takes his place, nor yet to play when his matches are done", () => {
    for (const points of [null, 0]) {
      const millar = draftMan("Millar", "M", points, 0, 0, { club: "Hull City", fitness: "Hamstring injury" });
      const ctx = contextOf(draftSide("Dons", 20, eleven("h", { 5: millar }), [draftMan("Meunier", "M", 3, 90, 0, { club: "Sunderland" })]), draftSide("Rovers", 30, eleven("a")));
      expect(ctx.angle?.story.kind).toBe("injury");
      const cast = line(matchupBlock(ctx, "gameweek", 1), "Millar,");
      expect(cast).toContain("Hull City midfielder Millar, for Dons");
      expect(cast).toContain("Meunier came on for him");
      expect(cast).not.toMatch(/a reserve|on the bench|yet to play/u);
    }
  });

  it("tells a reserve who comes on only if he plays, with a man ahead still to play, as the thread does", () => {
    const kickoff = "2026-09-27T15:30:00Z";
    const hume = draftMan("Hume", "D", null, 0, 1, { club: "Sunderland", next: { opponent: "Man City", home: false, kickoff } });
    const reserve = draftMan("Stach", "M", null, 0, 1, { club: "Leeds", next: { opponent: "Crystal Palace", home: true, kickoff } });
    const ctx = contextOf(draftSide("Dons", 18, eleven("h", { 2: hume, 5: draftMan("Millar", "M", null, 0, 0, { club: "Hull City" }) }), [reserve]), draftSide("Rovers", 20, eleven("a")), {}, "saturday");
    const [sub] = ctx.state.home.subs;
    expect(sub).toMatchObject({ provisional: true, ahead: hume });
    expect(subLine(sub, "saturday")).toBe("Stach comes on at the end of the gameweek for a man who did not play, if he plays");
    const angled = { ...ctx, angle: ctx.angle === null ? null : { ...ctx.angle, cast: [reserve] } };
    expect(line(matchupBlock(angled, "saturday", 1), "Stach,")).toContain("comes on at the end of the gameweek for a man who did not play, if he plays");
  });

  it("puts an before a vowel in last time's story", () => {
    const base = lateDecider();
    const ctx = { ...base, angle: base.angle === null ? null : { ...base.angle, past: [{ kind: "upset" as const, family: "upset" as const, teamIds: ["test2"], cast: [] }, { kind: "early-off" as const, family: "setback" as const, teamIds: ["123"], cast: [] }] } };
    const block = matchupBlock(ctx, "gameweek", 1);
    expect(block).toContain("- test2: an upset");
    expect(block).toContain("- 123: an early off");
  });
});
