import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "tailwindcss";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import DraftReport from "./DraftReport";
import Lineups from "./Lineups";
import PaperTable from "./PaperTable";
import Ranks from "./Ranks";
import Reports from "./Reports";
import Sheets from "./Sheets";
import TeamNews from "./TeamNews";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/derbies", () => ({ derbyBetween: () => null }));
vi.mock("../../football", () => ({ seasonFixtures: async () => [] }));
vi.mock("../../matchFeed", () => ({ matchHighlight: async () => null }));

/** The border colour Tailwind gives the rows of the list in `html`, read off the CSS its classes compile to; null for none. */
async function rowRule(html: string): Promise<string | null> {
  const list = html.match(/class="([^"]*\bdivide-y\b[^"]*)"/);
  if (list === null) throw new Error("no ruled list rendered");
  const css = (await compile("@tailwind utilities;")).build(list[1].split(" "));
  return css.match(/> :not\(:last-child\)\) \{\s*border-color: ([^;]+);/)?.[1] ?? null;
}

type Extras = NonNullable<PublishedStory["extras"]>;

const story = (extras: Extras) => ({ kind: "presser", extras }) as PublishedStory;
const named = (teamId: string) => teamId;
const side = (teamId: string) => ({ teamId, formation: null, line: "", xi: [], bench: [] });
const lineup = (club: string) => ({ club, code: 3, formation: "4-3-3", men: [] });
const draftSide = (teamId: string) => ({ teamId, name: teamId, score: 0, rankBefore: null, rankAfter: null, run: "", returns: { goals: [], assists: [], cleanSheets: [] }, eleven: [], bench: [] });
const draftMatchup = { home: draftSide("a"), away: draftSide("b"), verdict: "", standfirst: "", paragraphs: [], byDay: [], story: null, face: null };
const reportSide = (code: number) => ({ code, score: 0, goals: [], assists: [], manager: null, lineup: null, next: null });
const report = (fixtureCode: number) => ({
  fixtureCode, kickoff: "", home: reportSide(3), away: reportSide(7), halfTime: null, venue: null, attendance: null, referee: null,
  standfirst: "", account: "", sections: [], keyStats: [], fantasy: { top: [], wire: [] }, rows: [], video: null,
});

const row = (key: string) => ({ key, rank: 1, name: key, played: null, detail: null, points: null });

const lists: [string, () => Promise<ReactNode>][] = [
  ["a column's rows (the front page's tables)", async () =>
    createElement(PaperTable, { title: "The draft table", rows: [row("a"), row("b")] })],
  ["the power rankings", async () =>
    createElement(Ranks, { story: story({ ranks: [{ teamId: "a", line: "" }, { teamId: "b", line: "" }] }), named, mine: null })],
  ["the predicted elevens", async () =>
    createElement(Lineups, { story: story({ lineups: [{ home: lineup("A"), away: lineup("B"), kickoff: "2026-10-10T14:00:00Z" }, { home: lineup("C"), away: lineup("D"), kickoff: "2026-10-10T14:00:00Z" }] }), named, mine: null })],
  ["the team sheets", async () =>
    createElement(Sheets, { story: story({ sheets: [{ home: side("a"), away: side("b") }, { home: side("c"), away: side("d") }] }), named, mine: null, snapshot: null })],
  ["a draft report's match-ups", async () =>
    createElement(DraftReport, { story: story({ draft: { cutoff: "gameweek", gameweek: 6, matchups: [draftMatchup, draftMatchup] } }), snapshot: null })],
  ["a match-day report's matches", async () =>
    Reports({ story: story({ reports: [report(1), report(2)] }), snapshot: null })],
];

describe("the rule between a paper list's rows", () => {
  it.each(lists)("is the sheet's faint hairline on %s, not the rows' own ink", async (_, render) => {
    expect(await rowRule(renderToStaticMarkup(await render()))).toBe("var(--paper-rule)");
  });

  // Set in newspaper columns, the team news rules each club rather than the list: `divide-y` cannot cross a column.
  it("is the sheet's faint hairline under each club of the team news thread", () => {
    const html = renderToStaticMarkup(
      createElement(TeamNews, { story: story({ teamNews: [{ club: "Chelsea", code: null, line: "" }, { club: "Arsenal", code: null, line: "" }] }) }),
    );
    expect(html.match(/<section class="[^"]*border-\[var\(--paper-rule\)\]/g)).toHaveLength(2);
  });
});
