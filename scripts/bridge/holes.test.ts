import type { Bridge } from "@epl/core";
import { describe, expect, it } from "vitest";
import bootstrap from "../../packages/core/src/football/fpl/__fixtures__/bootstrap.json";
import { holeIn } from "./holes";

// Why a rostered man resolves to no footballer, against a recorded FPL bootstrap: no network.

const CODES = new Set(bootstrap.elements.map((element) => element.code));
const LISTED = bootstrap.elements[0].code;
/** A code no element in the fixture carries: a man FPL has dropped since the bridge was built. */
const DROPPED = Math.max(...CODES) + 1;

const BRIDGE: Bridge = {
  listed: { fplCode: LISTED, matchedBy: "exact", confidence: 100 },
  dropped: { fplCode: DROPPED, matchedBy: "exact", confidence: 100 },
  guessed: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 41 },
  confirmed: { status: "unmapped", unmappedBy: "manual", note: "academy" },
  confirmedGuess: { status: "unmapped", unmappedBy: "no-fpl-match", auditedAt: "2026-09-01" },
};

describe("holeIn", () => {
  it("passes a man bridged to a footballer FPL lists", () => {
    expect(holeIn("listed", BRIDGE, CODES)).toBeNull();
  });

  it("names a man bridged to a code FPL no longer lists as absent, the hole a squad view draws for him", () => {
    expect(holeIn("dropped", BRIDGE, CODES)).toBe("absent");
  });

  it("names a man the bridge has never seen as unbridged", () => {
    expect(holeIn("new-to-the-pool", BRIDGE, CODES)).toBe("unbridged");
  });

  it("names the matcher's own guess of nobody as assumed-unmapped", () => {
    expect(holeIn("guessed", BRIDGE, CODES)).toBe("assumed-unmapped");
  });

  it("lets a person's verdict of no footballer stand as audited", () => {
    expect(holeIn("confirmed", BRIDGE, CODES)).toBe("audited");
    expect(holeIn("confirmedGuess", BRIDGE, CODES)).toBe("audited");
  });
});
