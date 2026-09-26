import { describe, expect, it } from "vitest";
import { sheetsFacts } from "../sheets/facts";
import { man, side } from "../sheets/__fixtures__/sides";
import { buildSheetsBrief } from "./sheets";

const story = (content: string) => ({ id: "1", headline: "", content, analysis: null, at: 1 });
const games = (goals: number[], assists = 0) => goals.map((scored) => ({ gameweek: 1, minutes: 90, goals: scored, assists, cleanSheets: 0, points: 0 }));

function brief(history: boolean) {
  const home = side("h", ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Palmer:M:3", "Haaland:F:11"], ["Kane:F:11"]);
  home.starters[1] = man("Saliba:D:1", { status: "i" });
  const away = side("w", ["Pickford:G:12", "Gray:M:12", "Isak:F:12"]);
  away.starters[1] = man("Gray:M:12", { status: "d" });
  const ties = sheetsFacts({
    pairings: [{ home: { teamId: "h" }, away: { teamId: "w" } }],
    sheets: new Map([["h", home], ["w", away]]),
    history: history
      ? new Map([["h", [side("h", ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Kane:F:11", "Haaland:F:11"], ["Palmer:M:3"])]], ["w", [side("w", ["Pickford:G:12", "Gray:M:12", "Isak:F:12"])]]])
      : new Map(),
    fixtures: [{ homeClubId: 11, awayClubId: 12 }, { homeClubId: 1, awayClubId: 8 }],
    lastWrote: new Map(),
    playing: new Set([1, 8, 11, 12]),
    news: (each) => (each.player.name === "Saliba" ? story("Saliba (hamstring) will miss the next six weeks, per a report.") : null),
    recent: (each) => (each.player.name === "Isak" ? games([1, 2, 1]) : each.player.name === "Kane" ? games([0, 0, 1], 1) : []),
    predicted: (each) => (each.player.name === "Pickford" ? false : null),
  });
  return buildSheetsBrief({ gameweek: 6, ties, clubName: (id) => `Club ${id}`, fixture: (id) => (id === 11 ? "at home to Club 12" : id === 12 ? "away to Club 11" : null) });
}

describe("buildSheetsBrief", () => {
  it("gives each man his club and fixture, and a side's changes and weightiest notes", () => {
    const text = brief(true);
    expect(text).toContain("Haaland (F, Club 11, at home to Club 12)");
    expect(text).toContain("CHANGES from last gameweek's sheet: 1.");
    expect(text).toContain("IN: Palmer (M, from the bench)");
    expect(text).toContain("OUT: Kane (F, dropped to the bench)");
    expect(text).toContain("NAMED, WITH NO MATCH: Palmer (M). Club 3 do not play this gameweek.");
    expect(text).toContain("NAMED BUT OUT THIS WEEKEND: Saliba (D, Club 1; injured, hamstring).");
    expect(text).toContain("DROPPED, DESPITE HIS FORM: Kane (F), last time out: 1 goal, 1 assist. He started last gameweek.");
  });

  it("carries no provider's sentence, no source and no percentage", () => {
    const text = brief(true);
    expect(text).not.toMatch(/miss the next six weeks|per a report|%|projected|predicted eleven|FPL|Fantrax/u);
  });

  it("puts an unchanged side's unchanged after its news, and cuts a side to its weightiest notes", () => {
    const text = brief(true);
    const away = text.slice(text.indexOf("SIDE Team w"));
    expect(away).toContain("NAMED BUT A DOUBT THIS WEEKEND: Gray (M, Club 12, away to Club 11).");
    expect(away).toContain("IN FORM: Isak (F), recently: 4 goals, scoring in every game.");
    expect(away).toContain("NAMED, BUT MIGHT NOT START FOR CLUB 12: Pickford (G).");
    expect(away.indexOf("UNCHANGED")).toBeGreaterThan(away.indexOf("MIGHT NOT START"));
  });

  it("names the other side with its man where the sheets meet", () => {
    expect(brief(true)).toContain("- Team h's Haaland (F, Club 11) against Team w's Pickford (G, Club 12), in Club 11 v Club 12.");
  });

  it("forbids changes and debuts on a first sheet", () => {
    const text = brief(false);
    expect(text).toContain("FIRST SHEET: there is no earlier sheet to compare with.");
    expect(text).not.toContain("DEBUTS");
  });
});
