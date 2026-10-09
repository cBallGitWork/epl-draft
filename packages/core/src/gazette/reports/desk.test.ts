import { describe, expect, it } from "vitest";
import type { PlMoment } from "../../football/premierleague/moments";
import { ENZO, HAVERTZ, PALMER, SAKA, deskOf, matchInput, moment, reportMan, shot } from "./__fixtures__/built";
import { matchBlock } from "./brief";
import { punBrief } from "./headline";

const desk = (moments: PlMoment[], score: [number, number]) => deskOf(matchInput([SAKA, HAVERTZ, PALMER, ENZO], moments, score));

describe("deskDay's calls on a made-up match", () => {
  it("opens on a collapse only when the other side scored late, never on the collapsing side's own late goal", () => {
    // Arsenal 2-0 up, pegged back to 2-2, then their own winner in the 85th.
    const goals = [moment("10", "goal", [1, null]), moment("20", "goal", [2, null]), moment("30", "goal", [3, null]), moment("40", "goal", [4, null]), moment("85", "goal", [1, null])];
    expect(desk(goals, [3, 2]).opening).toBe("the winner came with five minutes left");
  });

  it("still opens on a collapse when the other side's goals came late", () => {
    const goals = [moment("10", "goal", [1, null]), moment("20", "goal", [2, null]), moment("82", "goal", [3, null]), moment("88", "goal", [4, null])];
    expect(desk(goals, [2, 2]).opening).toBe("Arsenal were 2-0 up in the 20th minute, and the other side scored twice from the 80th minute on");
  });

  it("describes a goal from long range at an angle as the distance goal", () => {
    const goals = [
      moment("10", "goal", [2, null], { shot: shot({ foot: "header" }) }),
      moment("30", "goal", [1, null], { shot: shot({ from: "from long range, at an angle" }) }),
    ];
    expect(desk(goals, [2, 0]).described?.man?.name).toBe("Bukayo Saka");
  });
});

describe("own goals in the briefs", () => {
  // Reece James comes on for Palmer and puts it into his own net.
  const james = reportMan(5, "Reece James", "away", { started: false, onAt: "60" });
  const match = matchInput([SAKA, PALMER, james], [moment("60", "substitution", [5, 3]), moment("70", "own-goal", [5, null])], [1, 0]);

  it("never calls a substitute's own goal his decisive goal", () => {
    expect(matchBlock(deskOf(match))).not.toContain("went on to score or make a goal");
  });

  it("tells the pun writer an own goal is the other club's goal", () => {
    const goals = punBrief(deskOf(match), "").split("\n").find((line) => line.startsWith("THE GOALS"));
    expect(goals).toBe("THE GOALS: an own goal by Reece James (Chelsea), for Arsenal, in the 70th minute.");
  });
});
