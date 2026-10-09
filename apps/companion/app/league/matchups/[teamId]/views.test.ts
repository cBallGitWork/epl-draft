import { describe, expect, it } from "vitest";
import { matchupTabs, matchupView, pickTie, statsHref, statsOf, tieTabs } from "./views";

describe("matchupView", () => {
  it("reads a named view and opens on lineups for anything else", () => {
    expect(matchupView("stats")).toBe("stats");
    expect(matchupView(undefined)).toBe("lineups");
    expect(matchupView("nonsense")).toBe("lineups");
  });
});

describe("matchupTabs", () => {
  it("keeps the round in every link and leaves the opening view out of the query", () => {
    const hrefs = matchupTabs("abc", 5).map((tab) => tab.href);
    expect(hrefs[0]).toBe("/league/matchups/abc?gw=5");
    expect(hrefs[1]).toBe("/league/matchups/abc?gw=5&view=stats");
  });

  it("names no round when the URL named none", () => {
    expect(matchupTabs("abc", undefined)[2]?.href).toBe("/league/matchups/abc?view=fixtures");
  });
});

describe("statsHref", () => {
  it("opens on the fantasy report and names a side board and a sort only when they differ", () => {
    expect(statsOf(undefined)).toBe("fantasy");
    expect(statsHref("abc", 5, "fantasy")).toBe("/league/matchups/abc?gw=5&view=stats");
    expect(statsHref("abc", 5, "team", { head: "G", descending: false })).toBe(
      "/league/matchups/abc?gw=5&view=stats&of=team&sort=G&dir=asc",
    );
  });
});

describe("a double header", () => {
  const team = (teamId: string) => ({ teamId, name: `Team ${teamId}` });
  const ties = [
    { team: team("abc"), opponent: team("x"), home: team("abc") },
    { team: team("abc"), opponent: team("y"), home: team("y") },
  ];

  it("opens on the tie the URL names, else the schedule's first", () => {
    expect(pickTie(ties, "y")?.opponent.teamId).toBe("y");
    expect(pickTie(ties, undefined)?.opponent.teamId).toBe("x");
    expect(pickTie(ties, "nobody")?.opponent.teamId).toBe("x");
    expect(pickTie([], "y")).toBeUndefined();
  });

  it("gives a tab to each tie, keeping the round and the view, and names only the second", () => {
    expect(tieTabs("abc", 5, "stats", ties)).toEqual([
      { key: "x", label: "v Team x", href: "/league/matchups/abc?gw=5&view=stats" },
      { key: "y", label: "v Team y", href: "/league/matchups/abc?gw=5&view=stats&vs=y" },
    ]);
    expect(tieTabs("abc", 5, "lineups", ties.slice(0, 1))).toEqual([]);
  });

  it("keeps the tie in every view's link and in Stats'", () => {
    expect(matchupTabs("abc", 5, "y")[1]?.href).toBe("/league/matchups/abc?gw=5&view=stats&vs=y");
    expect(statsHref("abc", 5, "team", undefined, "y")).toBe("/league/matchups/abc?gw=5&view=stats&of=team&vs=y");
  });
});
