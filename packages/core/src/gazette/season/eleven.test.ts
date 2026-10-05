import { describe, expect, it } from "vitest";
import { formations } from "../../league/formations";
import { bestEleven, type ElevenMan } from "./eleven";

const RULES = formations({
  maxTotalPlayers: 14,
  maxActivePlayers: 11,
  maxReservePlayers: 3,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3, M: 2, F: 1 },
});
const man = (id: string, slots: Record<string, number>): ElevenMan => ({ id, slots });

/** A fourteen-man squad: two keepers, five defenders, five midfielders, two forwards. */
function squad(): ElevenMan[] {
  return [
    man("g1", { G: 4 }),
    man("g2", { G: 3 }),
    ...[6, 5, 4, 3, 2].map((points, at) => man(`d${at}`, { D: points })),
    ...[9, 8, 7, 1, 1].map((points, at) => man(`m${at}`, { M: points })),
    man("f0", { F: 10 }),
    man("f1", { F: 2 }),
  ];
}

describe("bestEleven", () => {
  it("fields eleven within every position's minimum and maximum, best total first", () => {
    const eleven = bestEleven(squad(), RULES);
    expect(eleven?.picks).toHaveLength(11);
    const count = (slot: string) => eleven?.picks.filter((pick) => pick.slot === slot).length;
    expect([count("G"), count("D"), count("M"), count("F")]).toEqual([1, 5, 3, 2]);
    expect(eleven?.total).toBe(4 + 6 + 5 + 4 + 3 + 2 + 9 + 8 + 7 + 10 + 2);
  });

  it("plays a man at whichever eligible slot the side needs", () => {
    const men = [...squad().filter((each) => each.id !== "f1"), man("mf", { M: 3, F: 2.5 })];
    const eleven = bestEleven(men, RULES);
    expect(eleven?.picks.find((pick) => pick.id === "mf")?.slot).toBe("M");
    expect(eleven?.picks.filter((pick) => pick.slot === "F")).toHaveLength(1);
  });

  it("starts a weak man where a minimum demands him", () => {
    const men = squad().map((each) => (each.id.startsWith("d") ? { ...each, slots: { D: 0.5 } } : each));
    const eleven = bestEleven(men, RULES);
    expect(eleven?.picks.filter((pick) => pick.slot === "D")).toHaveLength(3);
  });

  it("is null when the squad cannot reach a legal shape", () => {
    expect(bestEleven(squad().filter((each) => !each.id.startsWith("g")), RULES)).toBeNull();
  });
});
