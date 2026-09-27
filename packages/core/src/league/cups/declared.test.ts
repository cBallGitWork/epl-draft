import { describe, expect, it } from "vitest";
import { seededBracket } from "./bracket";
import { CUPS, type Cup } from "./declared";
import { doubleBracket } from "./doubleBracket";
import { groupQualifiers, groupTable } from "./groupTable";
import { roundRobin } from "./roundRobin";
import { scheduleRounds } from "./schedule";

// The league has ten teams on 27 Sep. The declarations never say so; these tests do.
const TEAMS = 10;

const cup = (id: string): Cup => {
  const found = CUPS.find((declared) => declared.id === id);
  if (!found) throw new Error(`no cup ${id}`);
  return found;
};

const weeks = (schedule: Map<string, number>) => Object.fromEntries(schedule);

describe("Timbeibs Cup", () => {
  const timbeibs = cup("timbeibs");
  const rounds = doubleBracket(TEAMS);
  const schedule = scheduleRounds(rounds, timbeibs.knockout.finalGameweek);

  it("starts the week after its seeding round and ends on Boxing Day", () => {
    expect(timbeibs.seeding).toEqual({ from: "gameweek", gameweek: 9 });
    expect(weeks(schedule)).toEqual({
      W1: 10,
      W2: 11,
      W3: 12,
      L2: 12,
      W4: 13,
      L3: 13,
      L4: 14,
      L5: 15,
      L6: 16,
      F: 17,
    });
  });
});

describe("Davy Propper Cup", () => {
  const propper = cup("davy-propper");
  if (propper.seeding.from !== "groups") throw new Error("the Davy Propper Cup has groups");
  const stage = propper.seeding.stage;

  it("plays its groups GW21 to GW25 and its one-leg knockout GW28 to a GW30 final", () => {
    const groupRounds = roundRobin(Array.from({ length: TEAMS / stage.groups }, (_, at) => `t${at}`));
    const lastGroupWeek = stage.firstGameweek + groupRounds.length - 1;
    expect(lastGroupWeek).toBe(25);

    const bracket = seededBracket(stage.groups * stage.qualify);
    const schedule = scheduleRounds(bracket, propper.knockout.finalGameweek);
    expect(weeks(schedule)).toEqual({ W1: 28, W2: 29, W3: 30 });
  });

  it("sends the group winners straight to the semi-finals, where they meet a quarter-final winner", () => {
    const groups = [
      ["a1", "a2", "a3", "a4", "a5"],
      ["b1", "b2", "b3", "b4", "b5"],
    ];
    const seeds = groupQualifiers(
      groups.map((group) => groupTable(group, [], stage.points)),
      stage.qualify,
    ).map((row) => row.teamId);
    const [quarters, semis] = seededBracket(seeds.length);
    const named = (side: { seed: number } | { winnerOf: string } | { loserOf: string }) =>
      "seed" in side ? seeds[side.seed - 1] : side;
    expect(quarters?.ties.map((tie) => [named(tie.home), named(tie.away)])).toEqual([
      ["b2", "a3"],
      ["a2", "b3"],
    ]);
    expect(semis?.ties.map((tie) => [named(tie.home), named(tie.away)])).toEqual([
      ["a1", { winnerOf: "W1-1" }],
      ["b1", { winnerOf: "W1-2" }],
    ]);
  });
});
