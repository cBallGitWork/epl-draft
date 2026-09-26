import { describe, expect, it } from "vitest";
import { sheetsFacts } from "../sheets/facts";
import { side } from "../sheets/__fixtures__/sides";
import { buildSheetsBrief } from "./sheets";

const XI = ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Palmer:M:3", "Haaland:F:11"];

function brief(history: boolean) {
  const now = side("h", XI, ["Eze:M:8"]);
  const ties = sheetsFacts({
    pairings: [{ home: { teamId: "h" }, away: { teamId: "w" } }],
    sheets: new Map([["h", now], ["w", side("w", ["Pickford:G:12"])]]),
    history: history ? new Map([["h", [side("h", ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Eze:M:8", "Haaland:F:11"], ["Palmer:M:3"])]], ["w", [side("w", ["Pickford:G:12"])]]]) : new Map(),
    fixtures: [{ homeClubId: 11, awayClubId: 12 }],
    lastWrote: new Map(),
    playing: new Set([1, 8, 11, 12]),
    news: (each) => (each.player.name === "Rice" ? { id: "1", headline: "Rice a doubt", content: "Rice has a knock and faces a late test.", analysis: null, at: 1 } : null),
    recent: (each) => {
      const games = (goals: number[], assists = 0) => goals.map((scored) => ({ gameweek: 1, minutes: 90, goals: scored, assists, cleanSheets: 0, points: 0 }));
      return each.player.name === "Haaland" ? games([1, 2, 1]) : each.player.name === "Eze" ? games([0, 0, 1], 1) : [];
    },
    predicted: (each) => (each.player.name === "Saliba" ? false : null),
  });
  return buildSheetsBrief({ gameweek: 6, ties, clubName: (id) => `Club ${id}` });
}

describe("buildSheetsBrief", () => {
  it("gives each side's sheet, its changes, the benched man above a starter, and its flags", () => {
    const text = brief(true);
    expect(text).toContain("NAMED IN THE ELEVEN: Raya (G, Club 1); Saliba (D, Club 1); Rice (M, Club 1); Palmer (M, Club 3); Haaland (F, Club 11)");
    expect(text).toContain("CHANGES from last round's sheet: 1.");
    expect(text).toContain("IN: Palmer (M, from the bench)");
    expect(text).toContain("OUT: Eze (M, dropped to the bench)");
    expect(text).toContain("DEBUTS: none. Do not use the word debut about this side.");
    expect(text).toContain("DROPPED, DESPITE HIS FORM: Eze (M) is dropped to the bench after starting last round. Last time out: 1 goal, 1 assist. Over his last 3 rounds: 1 goal, 3 assists.");
    expect(text).toContain("NAMED, WITH NO MATCH: Palmer (M). Club 3 do not play this round.");
    expect(text).toContain("NAMED, AND IN THE NEWS (reported 1 Jan): Rice (M). Rice has a knock and faces a late test.");
    // Five notes for one side: the four weightiest are kept, and the man who might not start is the one cut.
    expect(text).not.toContain("MIGHT NOT START");
    expect(text).toContain("IN FORM: Haaland (F, named): 4 goals in his last 3 rounds, scoring in each.");
    expect(text).toContain("Team h's Haaland (F) against Team w's Pickford (G), in Club 11 v Club 12.");
    expect(text).not.toMatch(/\b7\b|points: |%|projected above|predicted eleven/u);
  });

  it("forbids changes and debuts on a first sheet", () => {
    const text = brief(false);
    expect(text).toContain("FIRST SHEET: there is no earlier sheet to compare with.");
    expect(text).not.toContain("DEBUTS");
  });
});
