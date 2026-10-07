import { describe, expect, it } from "vitest";
import type { MinutesUpdate } from "../football/intel/minuteMoves";
import { minutesNews } from "./minutes";

const NAMES: Record<string, string> = { t1: "Raccoons", t2: "Dome" };
const name = (id: string) => NAMES[id] ?? null;

// Recorded by `scripts/xmins-moves.ts`: Friday's export against Tuesday's, biggest move first, league-wide.
const FRIDAY: MinutesUpdate = {
  at: "2026-10-09T16:52:00.000Z",
  since: "2026-10-06T07:10:00.000Z",
  gameweek: 7,
  moves: [
    { code: 4, before: 85, after: 0 },
    { code: 1, before: 85, after: 30 },
    { code: 2, before: 45, after: 80 },
    { code: 9, before: 90, after: 20 },
  ],
};

const sides = [
  { teamId: "t1", men: [{ code: 1, name: "Saka" }, { code: 2, name: "Rice" }, { code: 3, name: "Odegaard" }] },
  { teamId: "t2", men: [{ code: 4, name: "Haaland" }] },
];
const options = { gameweek: 7, sides, name, mine: "t1" };

describe("minutesNews", () => {
  it("writes the moves on his side and his opponent's, his own first", () => {
    const [item] = minutesNews([FRIDAY], options);
    expect(item.headline).toBe("Gameweek 7 expected minutes: Saka down, Rice up and 1 more");
    expect(item.body).toBe("Yours since Tuesday: Saka down to 30 from 85 and Rice up to 80 from 45. Dome's: Haaland down to 0 from 85.");
    expect(item.from).toBe("Your scout");
    expect(item.at).toBe(FRIDAY.at);
    expect(item.id).toBe("xmins:2026-10-09T16:52:00.000Z");
  });

  // A league-wide move on a man in neither squad (code 9) is somebody else's letter.
  it("names nobody outside the two squads", () => {
    expect(minutesNews([FRIDAY], options)[0].body).not.toContain("90");
  });

  it("goes red when one of the reader's own men falls, and not for a rival's", () => {
    expect(minutesNews([FRIDAY], options)[0].urgent).toBe(true);
    const [theirs] = minutesNews([FRIDAY], { ...options, sides: [{ teamId: "t1", men: [] }, sides[1]] });
    expect(theirs.urgent).toBe(false);
    expect(theirs.headline).toBe("Gameweek 7 expected minutes: Haaland down");
    expect(theirs.body).toBe("Dome's since Tuesday: Haaland down to 0 from 85.");
  });

  it("writes one letter per update for the coming gameweek, and none for a past one", () => {
    const tuesday = { ...FRIDAY, at: "2026-10-06T07:10:00.000Z", since: "2026-10-02T16:50:00.000Z" };
    expect(minutesNews([tuesday, FRIDAY], options)).toHaveLength(2);
    expect(minutesNews([FRIDAY], { ...options, gameweek: 8 })).toEqual([]);
  });

  it("writes nothing to a reader with no team, or when no move touches either side", () => {
    expect(minutesNews([FRIDAY], { ...options, mine: null })).toEqual([]);
    expect(minutesNews([{ ...FRIDAY, moves: [{ code: 9, before: 90, after: 20 }] }], options)).toEqual([]);
  });
});
