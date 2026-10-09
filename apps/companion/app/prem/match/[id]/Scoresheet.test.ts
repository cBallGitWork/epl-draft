import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlGoal, PlGoalGroup } from "@epl/core";
import Scoresheet from "./Scoresheet";

// Two goals nobody can place, scored in one minute: core keeps them as two rows (#421).
const unplaced: PlGoalGroup = { scorer: null, own: false, minutes: [30], assisters: [] };
vi.mock("@epl/core", async (actual) => ({ ...(await actual<object>()), goalGroups: () => [unplaced, { ...unplaced }] }));
vi.mock("./ScoreRows", () => ({ Goal: () => null, Man: () => null }));

/** Every repeated key among siblings, rendering function components on the way down (none here holds a hook). */
function repeatedKeys(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    const keys = node.flatMap((child) => (isValidElement(child) && child.key !== null ? [child.key] : []));
    return [...keys.filter((key, at) => keys.indexOf(key) !== at), ...node.flatMap(repeatedKeys)];
  }
  if (!isValidElement(node)) return [];
  const props = node.props as { children?: ReactNode };
  return typeof node.type === "function"
    ? repeatedKeys((node.type as (props: object) => ReactNode)(props))
    : repeatedKeys(props.children);
}

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
