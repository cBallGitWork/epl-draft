import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LiveStrip from "./LiveStrip";

vi.mock("next/navigation", () => ({ usePathname: () => "/league" }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", () => ({ SMALL_CAPS: "" }));

/** The strip's two figures in order, each with whether it is dimmed. */
function figures(yours: number | null, theirs: number | null): { text: string; dim: boolean }[] {
  const html = renderToStaticMarkup(createElement(LiveStrip, { yours, theirs, opponent: "test2", href: "/league/matchups/a" }));
  return [...html.matchAll(/<span( class="opacity-70")?>([^<]*)<\/span>/g)].map((match) => ({ text: match[2], dim: match[1] !== undefined }));
}

describe("the live strip's score", () => {
  it("dims the trailing side's figure", () => {
    expect(figures(30, 41)).toEqual([{ text: "30", dim: true }, { text: "41", dim: false }]);
    expect(figures(41, 30)).toEqual([{ text: "41", dim: false }, { text: "30", dim: true }]);
  });

  it("dims neither figure on a level score, as no side trails", () => {
    expect(figures(38, 38)).toEqual([{ text: "38", dim: false }, { text: "38", dim: false }]);
  });

  it("dims neither figure beside a dash, as a missing total neither leads nor trails", () => {
    expect(figures(null, 38)).toEqual([{ text: "—", dim: false }, { text: "38", dim: false }]);
  });
});
