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

  it("never names the edition in a dateline: the kicker is the story's one name", () => {
    const html = renderToStaticMarkup(createElement(Dateline, { story: presser, byline: false, turn: false }));
    expect(html).not.toContain("The Team Sheet");
    expect(html).toContain("Filed");
  });

  it("names no second column under a kicker, as the Line-Ups did with The Form Guide", () => {
    const lineups = { ...presser, byline: "The Line-Ups", edition: "The Form Guide" } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Dateline, { story: lineups, byline: false, turn: false }));
    expect(html).not.toContain("The Form Guide");
  });
});
