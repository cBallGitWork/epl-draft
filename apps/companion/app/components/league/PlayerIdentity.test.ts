import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Opposition, RosteredPlayer } from "@epl/core";
import PlayerIdentity from "./PlayerIdentity";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => ({ LABEL: "", QUIET_FIGURE: "" }));

const rostered: RosteredPlayer = { slot: { fantraxId: "x", position: "D", status: "ACTIVE" }, unresolved: "unmapped" };

const card = (opposition: Opposition[] | undefined) =>
  renderToStaticMarkup(createElement(PlayerIdentity, { rostered, club: undefined, opposition }));

describe("the player card's fixture line", () => {
  it("promises no match to a man whose club has none this gameweek", () => {
    expect(card([])).toContain("No fixture");
    expect(card([])).not.toContain("Yet to play");
  });

  it("promises no match to a man the card has no fixture list for", () => {
    expect(card(undefined)).not.toContain("Yet to play");
  });

  it("still says when a man with a match to come kicks off", () => {
    const fixture = { id: 1, status: "upcoming", kickoff: "2026-10-10T14:00:00Z" };
    const against = { club: { shortName: "ARS" }, home: true, difficulty: 3, fixture } as unknown as Opposition;
    expect(card([against])).toContain("Kicks off Sat 15:00");
  });
});
