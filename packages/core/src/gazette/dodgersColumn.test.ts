import { describe, expect, it } from "vitest";
import type { Dodger } from "./dodgers";
import { dodgersColumn } from "./dodgersColumn";

const dodger = (over: Partial<Dodger> = {}): Dodger => ({
  playerName: "Wissa", playerCode: 1, clubId: 1, position: "F", ownerTeamId: "t1", ownerName: "test3", minutes: 90,
  goals: 0, assists: 0, cleanSheet: false, misses: [], shots: 0, onTarget: 0, inBox: 0, close: 0, chancesMade: 0, chancesInBox: 0,
  nearness: 1, ...over,
});

describe("dodgersColumn", () => {
  it("heads on the lead man's nearest miss and tells it with its minute in words", () => {
    const column = dodgersColumn(5, [dodger({ misses: [{ kind: "penalty-saved", minute: "45+2" }], shots: 2, onTarget: 1 })]);
    expect(column?.headline).toBe("Wissa's Penalty Saved");
    expect(column?.deck).toBe("The one who came closest to points in gameweek 5 and did not get them.");
    expect(column?.body).toBe("Wissa (test3): penalty saved two minutes into first-half added time; two shots, one on target.");
  });

  it("tells a lost clean sheet, shots in the box, chances made, and what he did get", () => {
    const column = dodgersColumn(5, [
      dodger({ playerName: "Leno", position: "G", misses: [{ kind: "clean-sheet-lost", minute: "89" }] }),
      dodger({ playerName: "Cunha", goals: 1, chancesMade: 3, chancesInBox: 2, misses: [{ kind: "set-up-woodwork", minute: "25" }] }),
      dodger({ playerName: "Gonzalo", shots: 3, inBox: 3, onTarget: 0 }),
    ]);
    expect(column?.body.split("\n\n")).toEqual([
      "Leno (test3): clean sheet lost to a goal in the 89th minute.",
      "Cunha (test3): a shot he set up came back off the woodwork in the 25th minute; set up three shots for others, two from inside the box, no assist; he did score.",
      "Gonzalo (test3): three shots, all from inside the box, none on target.",
    ]);
  });

  it("heads a man with no moment on his blank, and files nothing with nobody to name", () => {
    expect(dodgersColumn(5, [dodger({ shots: 3 })])?.headline).toBe("Wissa Fires Blanks");
    expect(dodgersColumn(5, [dodger({ goals: 1, chancesMade: 4 })])?.headline).toBe("Wissa Waits For An Assist");
    expect(dodgersColumn(5, [])).toBeNull();
  });
});
