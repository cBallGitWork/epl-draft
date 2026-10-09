import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import BinXi from "./BinXi";

vi.mock("next/image", () => ({ default: () => null }));

const man = (name: string, code: number, slot: string, points: number) => ({ name, code, slot, club: "COV", points, minutes: 90 });
const story = {
  kind: "bin-xi",
  extras: { bin: { shape: "4-4-2", total: 41, xi: [man("Carl Rushworth", 1, "G", 1), man("Bobby Thomas", 2, "D", 6)], bench: [], keyStats: [] } },
} as unknown as PublishedStory;

describe("the Bin XI", () => {
  it("prints a man's single point as 1 pt, as the report sidebar does, never 1 pts", () => {
    const html = renderToStaticMarkup(createElement(BinXi, { story, snapshot: null }));
    expect(html).toContain(">1 pt<");
    expect(html).not.toContain("1 pts");
    expect(html).toContain(">6 pts<");
  });
});
