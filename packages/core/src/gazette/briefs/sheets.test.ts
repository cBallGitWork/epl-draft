import { describe, expect, it } from "vitest";
import { sheetsFacts } from "../sheets/facts";
import { codeOf, man, side } from "../sheets/__fixtures__/sides";
import { buildSheetsBrief } from "./sheets";

const XI = ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Palmer:M:3", "Haaland:F:11"];

function brief(history: boolean, projected = false) {
  const now = side("h", XI, ["Eze:M:8"]);
  now.starters[2] = man("Rice:M:1", { status: "d", chanceOfPlaying: 75, news: "Knock - 75% chance of playing" });
  const ties = sheetsFacts({
    pairings: [{ home: { teamId: "h" }, away: { teamId: "w" } }],
    sheets: new Map([["h", now], ["w", side("w", ["Pickford:G:12"])]]),
    history: history ? new Map([["h", [side("h", ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Eze:M:8", "Haaland:F:11"], ["Palmer:M:3"])]], ["w", [side("w", ["Pickford:G:12"])]]]) : new Map(),
    projected: (code) => (code === codeOf("Eze") ? { points: 7, start: 0.9 } : code === codeOf("Palmer") ? { points: 3, start: 0.9 } : null),
    fixtures: [{ homeClubId: 11, awayClubId: 12 }],
    lastWrote: new Map(),
    playing: new Set([1, 8, 11, 12]),
    predicted: () => null,
  });
  return buildSheetsBrief({ gameweek: 6, ties, clubName: (id) => `Club ${id}`, projected });
}

describe("buildSheetsBrief", () => {
  it("gives each side's sheet, its changes, the benched man above a starter, and its flags", () => {
    const text = brief(true, true);
    expect(text).toContain("STARTS: Raya (G, Club 1); Saliba (D, Club 1); Rice (M, Club 1); Palmer (M, Club 3); Haaland (F, Club 11)");
    expect(text).toContain("CHANGES from last round's sheet: 1.");
    expect(text).toContain("IN: Palmer (M, from the bench)");
    expect(text).toContain("OUT: Eze (M, to the bench)");
    expect(text).toContain("DEBUTS: none. Do not use the word debut about this side.");
    expect(text).toContain("Eze (M) is on the bench, projected above Palmer (M), who starts.");
    expect(text).toContain("STARTS WITH NO MATCH: Palmer (M). Club 3 do not play this round.");
    expect(text).toContain("STARTS, FPL LISTS HIM DOUBTFUL: Rice (M), 75% chance of playing.");
    expect(text).toContain("Team h's Haaland (F) against Team w's Pickford (G), in Club 11 v Club 12.");
    expect(text).not.toMatch(/\b7\b|points: /u);
  });

  it("forbids changes and debuts on a first sheet, and a benching with no projections", () => {
    const text = brief(false);
    expect(text).toContain("FIRST SHEET: there is no earlier sheet to compare with.");
    expect(text).not.toContain("DEBUTS");
    expect(text).toContain("No projections cover this round");
  });
});
