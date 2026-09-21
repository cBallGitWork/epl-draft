import { describe, expect, it } from "vitest";
import { predictedLineups, type PredictedTie } from "./predictedXi";
import type { IntelClubXi, IntelXi } from "../football/intel/types";

const ARS = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" };
const CHE = { id: 6, code: 8, name: "Chelsea", shortName: "CHE" };

const TIE: PredictedTie = { home: ARS, away: CHE, kickoff: "2026-10-10T11:30:00Z" };

function eleven(from: number, formation = "4-2-3-1"): IntelClubXi {
  return {
    formation,
    slots: { GK: 1, CB: 2, FB: 2, DM: 2, AM: 3, CF: 1 },
    starters: Array.from({ length: 11 }, (_, i) => ({ code: from + i, prob: 0.9 })),
  };
}

function xi(clubs: Record<string, IntelClubXi>): IntelXi {
  return {
    manifest: { season: "26-27", gameweek: 6, exportedAt: "", rows: 20, sources: [] },
    fetchedAt: "2026-10-09T16:00:00Z",
    source: "ffscout",
    clubs,
  };
}

const named = (code: number) => ({ name: `Player ${code}`, position: "CM" });

describe("predictedLineups", () => {
  it("groups both elevens under the tie they are for", () => {
    const out = predictedLineups([TIE], xi({ ARS: eleven(100), CHE: eleven(200) }), named);
    expect(out).toHaveLength(1);
    expect(out[0].home.club).toBe("Arsenal");
    expect(out[0].away.club).toBe("Chelsea");
    expect(out[0].kickoff).toBe("2026-10-10T11:30:00Z");
  });

  it("keeps the source's own order and carries the crest's code", () => {
    const out = predictedLineups([TIE], xi({ ARS: eleven(100), CHE: eleven(200) }), named);
    expect(out[0].home.men.map((man) => man.name)).toEqual(
      Array.from({ length: 11 }, (_, i) => `Player ${100 + i}`),
    );
    expect(out[0].home.code).toBe(3);
    expect(out[0].home.formation).toBe("4-2-3-1");
  });

  it("prints Forest under the name the paper uses", () => {
    const forest = { id: 17, code: 17, name: "Nott'm Forest", shortName: "NFO" };
    const out = predictedLineups(
      [{ home: forest, away: CHE, kickoff: "x" }],
      xi({ NFO: eleven(300), CHE: eleven(200) }),
      named,
    );
    expect(out[0].home.club).toBe("Nottingham Forest");
  });

  it("drops the whole tie when one side's eleven is faulty", () => {
    const short = { ...eleven(100), starters: eleven(100).starters.slice(0, 10) };
    expect(predictedLineups([TIE], xi({ ARS: short, CHE: eleven(200) }), named)).toEqual([]);
  });

  it("drops the whole tie when a club has no predicted eleven at all", () => {
    expect(predictedLineups([TIE], xi({ ARS: eleven(100) }), named)).toEqual([]);
  });

  it("refuses a side with a man it cannot name, rather than printing ten", () => {
    const some = (code: number) => (code === 105 ? null : named(code));
    expect(predictedLineups([TIE], xi({ ARS: eleven(100), CHE: eleven(200) }), some)).toEqual([]);
  });

  it("files nothing when there is no export", () => {
    expect(predictedLineups([TIE], null, named)).toEqual([]);
  });
});
