import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublishedStory } from "@epl/core";
import Dateline from "./Dateline";
import { kickerOf } from "./kickers";

const presser = { kind: "presser", byline: "The Team Sheet", edition: "The Team Sheet", filedAt: "2026-10-09T15:40:00Z" } as PublishedStory;

describe("one name per story", () => {
  it("runs a story under its column's name, else its edition's", () => {
    expect(kickerOf(presser)).toBe("The Team Sheet");
    expect(kickerOf({ byline: "", edition: "The Form Guide" })).toBe("The Form Guide");
    expect(kickerOf({ byline: "", edition: "" })).toBe("");
  });

  it("drops the edition from a dateline whose kicker has already said it", () => {
    const html = renderToStaticMarkup(createElement(Dateline, { story: presser, byline: false, turn: false }));
    expect(html).not.toContain("The Team Sheet");
    expect(html).toContain("Filed");
  });

  it("keeps an edition the kicker does not name", () => {
    const report = { ...presser, byline: "The Back Page", edition: "Saturday Prem Report" } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Dateline, { story: report, byline: false, turn: false }));
    expect(html).toContain("Saturday Prem Report");
  });
});
