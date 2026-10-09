import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DraftLine } from "./Pedigree";

vi.mock("@/app/desk", () => import("../../desk"));

/** The draft line's words for a man taken with this overall pick. */
const line = (round: number, overall: number, drafterName: string | null = "Raccoons") =>
  renderToStaticMarkup(
    createElement(DraftLine, { pedigree: { origin: "draft", round, overall, teamId: "t1", against: null }, drafterName }),
  ).replace(/<[^>]+>/g, "");

describe("the draft line", () => {
  it("never calls an overall pick a pick within its round", () => {
    // The real draft's 11th name called was round 2's first pick, not its eleventh.
    expect(line(2, 11)).toBe("Taken by Raccoons with the 11th pick, in round 2.");
  });

  it("loses the drafter's clause when nobody can name him", () => {
    expect(line(1, 2, null)).toBe("Taken with the 2nd pick, in round 1.");
  });
});
