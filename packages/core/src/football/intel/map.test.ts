import { describe, expect, it } from "vitest";
import {
  predictedEleven,
  predictionAge,
  setPieceOrder,
  squadIntel,
  xiFault,
} from "./map";
import type { IntelClubXi, IntelPlayer, IntelSquads, IntelXi } from "./types";

function player(code: number, over: Partial<IntelPlayer> = {}): IntelPlayer {
  return {
    code,
    clubCode: "ARS",
    position: "CB",
    positionSource: "identity_primary_role",
    secondaryPositions: [],
    canCover: [],
    depthTier: 1,
    squadNumber: null,
    status: "available",
    expectedReturnGw: null,
    line: "CB",
    ...over,
  };
}

const MANIFEST = {
  season: "26-27",
  gameweek: 3,
  exportedAt: "2026-09-03T16:00:00Z",
  rows: 0,
  sources: [],
};

function squads(players: IntelPlayer[]): IntelSquads {
  return { manifest: { ...MANIFEST, rows: players.length }, players };
}

/** Eleven men, all at the same probability unless told otherwise. */
function eleven(over: Partial<IntelClubXi> = {}): IntelClubXi {
  return {
    formation: "4-2-3-1",
    slots: { GK: 1, CB: 2, FB: 2, DM: 2, AM: 1, WF: 2, CF: 1 },
    starters: Array.from({ length: 11 }, (_, at) => ({ code: at + 1, prob: 0.9 })),
    ...over,
  };
}

describe("squadIntel", () => {
  it("keys every player by his FPL code", () => {
    const byCode = squadIntel(squads([player(1), player(2)]));
    expect([...byCode.keys()]).toEqual([1, 2]);
  });

  it("is empty rather than throwing when there is no export", () => {
    expect(squadIntel(null).size).toBe(0);
  });

  it("drops a row with no usable code rather than keying it on nonsense", () => {
    // Several men under `NaN` collapse into one row, which is worse than the men
    // being absent — this is provider data and it is parsed, not asserted.
    const byCode = squadIntel(squads([player(1), player(Number.NaN), player(2)]));
    expect([...byCode.keys()]).toEqual([1, 2]);
  });

  it("carries a null position through, and says which source produced it", () => {
    // THE rule of this whole crossing. A position the exporter marked as coming
    // from FPL's `element_type` is FPL's fantasy classification, not a fact about
    // the footballer, and filling it from anywhere would put that classification
    // on a football screen.
    const fake = player(7, { position: null, positionSource: "fpl_element_type", line: null });
    const got = squadIntel(squads([fake])).get(7);
    expect(got?.position).toBeNull();
    expect(got?.line).toBeNull();
    expect(got?.positionSource).toBe("fpl_element_type");
  });
});

describe("xiFault", () => {
  it("passes a real eleven", () => {
    expect(xiFault(eleven())).toBeNull();
  });

  it("names a club with no prediction at all", () => {
    expect(xiFault(undefined)).toBe("no predicted eleven");
  });

  it("catches a squad that is not eleven", () => {
    const ten = eleven({ starters: eleven().starters.slice(0, 10) });
    expect(xiFault(ten)).toBe("10 starters, not 11");
  });

  it("catches a formation whose places do not add up", () => {
    // The sister asserts this at import; we take it over a wire, and a board
    // that quietly drew ten men is the failure nobody notices.
    expect(xiFault(eleven({ slots: { GK: 1, CB: 2 } }))).toBe("4-2-3-1 fills 3 places, not 11");
  });

  it("catches a formation it cannot resolve", () => {
    expect(xiFault(eleven({ slots: null }))).toBe("unknown formation 4-2-3-1");
  });
});

describe("predictedEleven", () => {
  it("chunks the source's own order into the formation's rows", () => {
    // FFScout lists a 4-2-3-1 as keeper, right-back across to left-back, the
    // two, the three, the one. Mirroring that needs no positions at all.
    const rows = predictedEleven(eleven());
    expect(rows.map((row) => row.line)).toEqual(["GK", "4", "2", "3", "1"]);
    expect(rows.map((row) => row.players.length)).toEqual([1, 4, 2, 3, 1]);
    // Right-back first, as the source lists him: the keeper stands at the top, so
    // the team faces the reader and its right is the reader's left.
    expect(rows[1]?.players.map((p) => p.code)).toEqual([2, 3, 4, 5]);
  });

  it("keeps the keeper out of the formation", () => {
    // `4-2-3-1` is ten outfield players. The eleventh keeps goal and is his own
    // row; no formation counts him.
    const rows = predictedEleven(eleven({ formation: "3-4-3" }));
    expect(rows.map((row) => row.line)).toEqual(["GK", "3", "4", "3"]);
    expect(rows.flatMap((row) => row.players).length).toBe(11);
  });

  it("refuses a shape whose numbers do not add to ten", () => {
    // Drawing ten men in a row labelled "4" would be the screen disagreeing
    // with the label above it, so it draws nothing and the caller says so.
    expect(predictedEleven(eleven({ formation: "4-4-4" }))).toEqual([]);
    expect(predictedEleven(eleven({ formation: "nonsense" }))).toEqual([]);
  });

  it("refuses a squad that is not eleven, rather than drawing it short", () => {
    const ten = eleven({ starters: eleven().starters.slice(0, 10) });
    expect(predictedEleven(ten)).toEqual([]);
  });

  it("draws nothing for a club with no prediction", () => {
    expect(predictedEleven(undefined)).toEqual([]);
  });
});

describe("setPieceOrder", () => {
  const PIECES = [
    { key: "penalties", label: "Penalties" },
    { key: "corners", label: "Corners" },
  ] as const;
  const city = {
    penalties: [
      { code: 2, share: 0.27 },
      { code: 1, share: 0.53 },
    ],
  };

  it("orders each piece by share, the biggest first", () => {
    const [pens] = setPieceOrder(city, PIECES);
    expect(pens?.takers.map((t) => t.code)).toEqual([1, 2]);
  });

  it("answers for a piece nobody takes, rather than dropping it", () => {
    // A caller that wants to say "nobody takes these" has to be told; one that
    // does not can filter.
    const [, corners] = setPieceOrder(city, PIECES);
    expect(corners).toEqual({ piece: "corners", label: "Corners", takers: [] });
  });

  it("answers for a club the source has never listed", () => {
    expect(setPieceOrder(undefined, PIECES).every((p) => p.takers.length === 0)).toBe(true);
  });
});

describe("predictionAge", () => {
  const xi = (fetchedAt: string | null): IntelXi => ({
    manifest: MANIFEST,
    fetchedAt,
    source: "ffscout",
    clubs: {},
  });

  it("ages the SOURCE and not the export", () => {
    // Re-running the export does not make FFScout's last look at a team sheet
    // any newer, so the manifest's `exportedAt` is the wrong clock.
    const age = predictionAge(xi("2026-09-03T12:00:00Z"), new Date("2026-09-03T18:00:00Z"));
    expect(age).toBe(6);
  });

  it("says nothing rather than guessing when the source will not say", () => {
    expect(predictionAge(xi(null), new Date())).toBeNull();
    expect(predictionAge(xi("not a date"), new Date())).toBeNull();
    expect(predictionAge(null, new Date())).toBeNull();
  });
});
