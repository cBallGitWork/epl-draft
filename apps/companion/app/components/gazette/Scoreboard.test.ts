import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LiveTeamScore } from "@epl/core";
import Scoreboard from "./Scoreboard";

vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/league/routes", () => ({ matchupHref: (id: string) => `/league/matchups/${id}` }));

const pairings = [{ home: { teamId: "a", name: "123" }, away: { teamId: "b", name: "test2" } }];
const scores = new Map<string, LiveTeamScore>([
  ["a", { teamId: "a", points: 12, toPlay: 3 }],
  ["b", { teamId: "b", points: 9, toPlay: 1 }],
]);

const strip = (live: boolean) => renderToStaticMarkup(createElement(Scoreboard, { pairings, scores, mine: null, live }));

describe("the front page's score strip", () => {
  it("calls the gameweek a gameweek between matches, in print and to a screen reader", () => {
    const html = strip(false);
    expect(html).toContain(">The gameweek<");
    expect(html).toContain('aria-label="The gameweek&#x27;s scores"');
    expect(html).not.toMatch(/round/i);
  });
});
