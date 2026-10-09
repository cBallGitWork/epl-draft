import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import names from "../../../../../data/leagues/short-names.json";
import Lineups from "./Lineups";

vi.mock("next/image", () => ({ default: () => null }));

// A team whose short name differs from its Fantrax name.
const [teamId, entry] = Object.entries(names.shortNames).find(([, each]) => each.short !== each.team) ?? ["", { team: "", short: "" }];
const side = (club: string) => ({ club, code: 3, formation: "4-3-3", men: [{ name: "Tarkowski", position: "CB", owner: teamId }] });
const story = { extras: { lineups: [{ home: side("Everton"), away: side("Hull City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;

describe("the predicted line-ups", () => {
  it("prints an owner by the league's short name, as the Team Sheet does", () => {
    const html = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null }));
    expect(html).toContain(`(<em>${entry.short}</em>)`);
    expect(html).not.toContain(`<em>${entry.team}</em>`);
  });

  it("marks a predicted starter the football has out, and keeps him in the eleven", () => {
    const out = { name: "Isak", position: "CF", status: "OUT" as const };
    const marked = { extras: { lineups: [{ home: { ...side("Liverpool"), men: [out] }, away: side("Man City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Lineups, { story: marked, named: () => entry.team, mine: null }));
    expect(html.replace(/<[^>]+>/g, "")).toContain("IsakOUT");
  });

  it("sets each man's position in bold", () => {
    const html = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null }));
    expect(html).toMatch(/<span class="[^"]*font-bold[^"]*">CB<\/span>/);
  });
});
