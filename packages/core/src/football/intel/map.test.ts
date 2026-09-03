import { describe, expect, it } from "vitest";
import { predictedEleven, predictionAge, setPieceOrder, squadIntel, xiFault } from "./map";
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
    setPieces: null,
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
    // Turned round within the line: the source lists a back four right-back
    // first, and a pitch is drawn from the reader's seat, so the right-back
    // belongs on the right.
    expect(rows[1]?.players.map((p) => p.code)).toEqual([5, 4, 3, 2]);
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
  const takers = [
    player(1, { setPieces: { corners: 2, penalties: 1 } }),
    player(2, { setPieces: { corners: 1 } }),
    player(3, { setPieces: null }),
  ];

  it("orders each piece by rank, first taker first", () => {
    const [corners, pens] = setPieceOrder(takers, ["corners", "penalties"]);
    expect(corners?.takers.map((p) => p.code)).toEqual([2, 1]);
    expect(pens?.takers.map((p) => p.code)).toEqual([1]);
  });

  it("leaves out a man who is not in that order at all", () => {
    // A rank is not a count. Padding the list with everybody would turn "nobody
    // has ranked him" into "he is third choice", which the source never said.
    const [corners] = setPieceOrder(takers, ["corners"]);
    expect(corners?.takers.map((p) => p.code)).not.toContain(3);
  });

  it("answers for a piece nobody takes, rather than dropping it", () => {
    const [none] = setPieceOrder(takers, ["fk_direct"]);
    expect(none).toEqual({ piece: "fk_direct", takers: [] });
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
