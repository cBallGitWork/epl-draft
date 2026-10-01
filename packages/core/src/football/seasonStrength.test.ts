import { describe, expect, it } from "vitest";
import { strengthBefore } from "./seasonStrength";
import type { ClubResult } from "./seasonStrength";

const CONFIG = { goalsShare: 0.5, settleGames: 6 };

/** Week after week: A scores three and keeps a clean sheet, B the reverse, C and D draw at the league average of 1.5. */
const season: ClubResult[] = Array.from({ length: 10 }, (_, i) => {
  const kickoff = `2025-09-${String(i + 1).padStart(2, "0")}T15:00:00Z`;
  return [
    { club: "A", kickoff, goalsFor: 3, goalsAgainst: 0, xgFor: 3, xgAgainst: 0 },
    { club: "B", kickoff, goalsFor: 0, goalsAgainst: 3, xgFor: 0, xgAgainst: 3 },
    { club: "C", kickoff, goalsFor: 1.5, goalsAgainst: 1.5, xgFor: 1.5, xgAgainst: 1.5 },
    { club: "D", kickoff, goalsFor: 1.5, goalsAgainst: 1.5, xgFor: 1.5, xgAgainst: 1.5 },
  ];
}).flat();

describe("strengthBefore", () => {
  it("knows nothing before a ball is kicked", () => {
    expect(strengthBefore(season, "A", "2025-08-01T00:00:00Z", CONFIG)).toEqual({ attack: 1, defence: 1 });
  });

  it("ranks the side that scores most as the strongest attack and the leakiest as the weakest defence", () => {
    const a = strengthBefore(season, "A", "2025-10-01T00:00:00Z", CONFIG);
    const b = strengthBefore(season, "B", "2025-10-01T00:00:00Z", CONFIG);
    expect(a.attack).toBeGreaterThan(1.5);
    expect(a.defence).toBeGreaterThan(1.5);
    expect(b.attack).toBeLessThan(0.7);
    expect(b.defence).toBeLessThan(0.7);
  });

  it("only counts matches kicked off before the one being rated", () => {
    const early = strengthBefore(season, "A", "2025-09-02T00:00:00Z", CONFIG);
    const late = strengthBefore(season, "A", "2025-10-01T00:00:00Z", CONFIG);
    expect(early.attack).toBeLessThan(late.attack);
  });

  it("eases in, so one big game does not make a side great", () => {
    expect(strengthBefore(season, "A", "2025-09-02T00:00:00Z", CONFIG).attack).toBeLessThan(1.5);
  });

  it("keeps an average side at average", () => {
    const c = strengthBefore(season, "C", "2025-10-01T00:00:00Z", CONFIG);
    expect(c.attack).toBeCloseTo(1, 1);
    expect(c.defence).toBeCloseTo(1, 1);
  });
});
