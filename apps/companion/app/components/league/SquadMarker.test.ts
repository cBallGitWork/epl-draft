import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SquadPlayerDetail } from "@epl/core";
import SquadMarker from "./SquadMarker";

vi.mock("next/image", () => ({ default: () => null }));

const unsettled = (position: string | null): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId: "x", position, status: "" }, unresolved: "unmapped" },
  club: undefined,
  opposition: undefined,
  points: undefined,
  minutes: [],
});

describe("an unsettled man's empty box on the pitch", () => {
  it("says his slot as every other box and card does, DEF and not the bare letter", () => {
    expect(renderToStaticMarkup(createElement(SquadMarker, { player: unsettled("D") }))).toContain(">DEF<");
  });

  it("says ? for a slot Fantrax left unnamed", () => {
    expect(renderToStaticMarkup(createElement(SquadMarker, { player: unsettled(null) }))).toContain(">?<");
  });
});
