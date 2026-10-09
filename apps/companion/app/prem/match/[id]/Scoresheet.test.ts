import { describe, expect, it, vi } from "vitest";
import { repeatedKeys } from "../../../repeatedKeys";
import type { PlGoal, PlGoalGroup } from "@epl/core";
import Scoresheet from "./Scoresheet";

// Two goals nobody can place, scored in one minute: core keeps them as two rows (#421).
const unplaced: PlGoalGroup = { scorer: null, own: false, minutes: [30], assisters: [] };
vi.mock("@epl/core", async (actual) => ({ ...(await actual<object>()), goalGroups: () => [unplaced, { ...unplaced }] }));
vi.mock("./ScoreRows", () => ({ Goal: () => null, Man: () => null }));

describe("the scoresheet", () => {
  it("keys two unplaced scorers' goals in one minute apart", () => {
    const goals = [{} as PlGoal];
    const sheet = Scoresheet({
      home: goals, away: [], homeElse: [], awayElse: [],
      owners: new Map(), byCode: new Map(), did: new Map(), injured: new Map(), cards: new Map(),
    });
    expect(repeatedKeys(sheet)).toEqual([]);
  });
});
