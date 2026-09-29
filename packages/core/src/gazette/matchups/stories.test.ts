import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { worthOf } from "./__fixtures__/worth";
import { sideStories } from "./stories";
import type { DraftMan, DraftSide } from "./types";

const side = (eleven: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: "t", name: "Dons", total: 40, eleven, bench, subOrder: [] });
const stories = (s: DraftSide, margin = 10, cutoff: "saturday" | "week" = "week") => sideStories(s, [], worthOf(), cutoff, margin);

describe("sideStories", () => {
  it("gives a man who returned one line with everything about him, and a blank nothing", () => {
    const lines = stories(
      side([
        draftMan("Isak", "F", 11, 90, 0, { club: "Liverpool", goals: 1, assists: 1, scoredAt: [{ minute: 90, added: 4 }] }),
        draftMan("Hall", "D", 8, 90, 0, { club: "Newcastle", goals: 1, scoredAt: [{ minute: 30 }] }),
        draftMan("Giles", "D", 1, 90, 0, { club: "Hull" }),
      ]),
    );
    expect(lines).toEqual(["Dons: Isak (Liverpool) hauled 11: a goal in added time (90+4) and an assist", "Dons: Hall (Newcastle) got 8: a goal"]);
  });

  it("tells a clean sheet lost late only where it was worth four and he had an hour, and an early exit by its minutes", () => {
    const lines = stories(
      side([
        draftMan("Tarkowski", "D", 2, 90, 0, { club: "Everton", concededFirstAt: [{ minute: 88 }] }),
        draftMan("Gray", "M", 2, 90, 0, { club: "Spurs", concededFirstAt: [{ minute: 88 }] }),
        draftMan("Hume", "D", 1, 11, 0, { club: "Sunderland" }),
      ]),
    );
    expect(lines).toEqual(["Dons: Tarkowski (Everton) lost a clean sheet worth 4 points to a goal in the 88th minute", "Dons: Hume (Sunderland) played 11 minutes"]);
  });

  it("says two of one club's men both blanked, and keeps no split line", () => {
    expect(stories(side([draftMan("Saliba", "D", 2, 90, 0, { club: "Arsenal" }), draftMan("Calafiori", "D", 1, 90, 0, { club: "Arsenal" })]))).toEqual(["Dons: two Arsenal men, Saliba and Calafiori, both blanked"]);
    expect(stories(side([draftMan("Pickford", "G", 6, 90, 0, { club: "Everton", cleanSheets: 1 }), draftMan("Keane", "D", 1, 90, 0, { club: "Everton" })]))).toEqual(["Dons: Pickford (Everton) got 6: a clean sheet"]);
  });

  it("names a bench score only for a side behind by less than it, and a blank no reserve could cover", () => {
    const bench = [draftMan("Star", "F", 9, 90, 0, { club: "Fulham" }), draftMan("Also", "F", 3, 90)];
    expect(stories(side([], bench), 5).filter((l) => l.includes("bench"))).toEqual([]);
    const lines = stories(side([draftMan("Foden", "M", null, 0, 0, { club: "Man City" })], bench), -5, "saturday");
    expect(lines).toEqual(["Dons: Foden (Man City) did not play and Dons have no reserve to replace him", "Dons: Star (Fulham) got 9 points on the bench"]);
  });

  it("puts what a substitute did in the line that brings him on", () => {
    const sub = { out: draftMan("Dunk", "D", null, 0, 0, { club: "Brighton" }), in: draftMan("Vuskovic", "D", 6, 90, 0, { club: "Brighton", cleanSheets: 1 }), provisional: false };
    expect(sideStories(side([sub.out]), [sub], worthOf(), "week", 5)).toEqual(["Dons: Vuskovic (Brighton) replaced Dunk (Brighton), who did not play, and got 6: a clean sheet"]);
    expect(sideStories(side([sub.out]), [sub], worthOf(), "saturday", 5)).toEqual(["Dons: Vuskovic (Brighton) replaces Dunk (Brighton), who did not play, with 6: a clean sheet"]);
  });
});
