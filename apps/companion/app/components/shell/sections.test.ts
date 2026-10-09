import { describe, expect, it } from "vitest";
import {
  CREDITS,
  MORE,
  SECTIONS,
  type BarTab,
  aheadOf,
  barSections,
  barTabs,
  drawsOwnGround,
  moreOwns,
  overflowSections,
  owns,
  sectionsFor,
  tabOwns,
} from "./sections";
import { PREM, PREM_RESULTS } from "../../prem/routes";
import { MY_TEAM, SQUAD } from "../../squad/routes";

// A rival's squad and the reader's own share a folder and differ by one segment,
// so these prove `owns` matches on that segment, not the prefix.

/** A Fantrax team id, which is sixteen characters of base-36. */
const RIVAL = "1b6gp5utmtj36y3g";

const myTeam = SECTIONS.find((section) => section.href === MY_TEAM);

describe("the My Team plate", () => {
  it("is a section", () => {
    // `Team`: `My Team` overflows the plate's label room at 320.
    expect(myTeam?.label).toBe("Team");
  });

  it("lights on every one of the reader's own tabs", () => {
    for (const tab of ["", "/transfers", "/next", "/fixtures", "/stats"]) {
      expect(owns(myTeam?.routes ?? [], `${MY_TEAM}${tab}`)).toBe(true);
    }
  });

  // `routes: ["/squad"]` would prefix-match every team and light My Team on a rival.
  it("stays dark on a rival, and on the index the sign-in lives on", () => {
    expect(owns(myTeam?.routes ?? [], `/squad/${RIVAL}`)).toBe(false);
    expect(owns(myTeam?.routes ?? [], `/squad/${RIVAL}/stats`)).toBe(false);
    expect(owns(myTeam?.routes ?? [], "/squad")).toBe(false);
  });

  it("is the only section the front door lights", () => {
    const lit = SECTIONS.filter((section) => owns(section.routes, MY_TEAM));
    expect(lit).toEqual([myTeam]);
  });
});

describe("the bar this round draws", () => {
  const labels = (sections: { label: string }[]) => sections.map((section) => section.label);
  const tabLabels = (tabs: BarTab[]) => tabs.map((tab) => (tab.kind === "group" ? tab.label : tab.section.label));

  it("carries My Team midweek, when Live does not exist", () => {
    const sections = sectionsFor(false);
    expect(tabLabels(barTabs(sections))).toEqual(["Gazetta", "Team", "Comps", "Data", "Mail"]);
    expect(labels(overflowSections(sections))).toEqual(["FPL"]);
  });

  it("gives Live My Team's slot while football is on", () => {
    const sections = sectionsFor(true);
    expect(tabLabels(barTabs(sections))).toEqual(["Gazetta", "Live", "Comps", "Data", "Mail"]);
    expect(labels(overflowSections(sections))).toEqual(["Team", "FPL"]);
  });

  it("folds Draft and Prem into Comps, in that order", () => {
    const comps = barTabs(sectionsFor(false)).find((tab) => tab.kind === "group");
    expect(comps?.kind === "group" && labels(comps.members)).toEqual(["Draft", "Prem"]);
  });

  it("lights Comps anywhere in either competition, and nowhere else", () => {
    const comps = barTabs(sectionsFor(false)).find((tab) => tab.kind === "group");
    for (const path of ["/league", "/league/matchups/x", "/prem", "/prem/club/43"]) {
      expect(comps && tabOwns(comps, path)).toBe(true);
    }
    for (const path of ["/players", "/news", "/"]) expect(comps && tabOwns(comps, path)).toBe(false);
  });

  // Six tabs at 320 leave 49px for a label: five and More.
  it("never asks a phone for more than six tabs", () => {
    for (const matchday of [false, true]) expect(barTabs(sectionsFor(matchday)).length).toBeLessThanOrEqual(5);
  });

  it("gives every tab a glyph, in both states", () => {
    for (const matchday of [false, true]) {
      for (const section of barSections(sectionsFor(matchday))) expect(section.glyph).toBeDefined();
      for (const tab of barTabs(sectionsFor(matchday))) {
        expect(tab.kind === "group" ? tab.glyph : tab.section.glyph).toBeDefined();
      }
    }
  });

  it("puts every section somewhere, in both states", () => {
    for (const matchday of [false, true]) {
      const sections = sectionsFor(matchday);
      expect(barSections(sections).length + overflowSections(sections).length).toBe(
        sections.length,
      );
      expect(sections.length).toBe(matchday ? SECTIONS.length : SECTIONS.length - 1);
    }
  });
});

describe("the More tab", () => {
  it("lights on its own page, the credits, the squad index and the sections behind it", () => {
    const sections = sectionsFor(false);
    for (const path of [MORE, CREDITS, SQUAD, "/fpl"]) {
      expect(moreOwns(sections, path)).toBe(true);
    }
  });

  it("stays dark on a rival's squad and on a section with its own tab", () => {
    const sections = sectionsFor(false);
    for (const path of [`${SQUAD}/${RIVAL}`, MY_TEAM, "/league", "/news", "/players"]) {
      expect(moreOwns(sections, path)).toBe(false);
    }
  });

  it("takes My Team while football is on, since Team has no tab then", () => {
    expect(moreOwns(sectionsFor(true), MY_TEAM)).toBe(true);
  });
});

describe("who draws the ground", () => {
  it("leaves a head-to-head's to the page, which draws its home team's venue", () => {
    expect(drawsOwnGround("/league/matchups/abc123")).toBe(true);
  });

  it("keeps the desk's behind the list of head-to-heads, which has no home side", () => {
    expect(drawsOwnGround("/league/matchups")).toBe(false);
  });

  it("leaves a team's screens to its own layout, which draws the team's venue", () => {
    expect(drawsOwnGround(`${SQUAD}/${RIVAL}`)).toBe(true);
    expect(drawsOwnGround(`${MY_TEAM}/fixtures`)).toBe(true);
  });

  it("keeps the desk's behind the squad index, which is nobody's", () => {
    expect(drawsOwnGround(SQUAD)).toBe(false);
  });
});

describe("the tabs fetched ahead", () => {
  // AutoRefresh fetches these pages, so a tap on a tab draws at once.
  it("are the bar's tabs and More on every tick, and Data's ~100KB board once, never a section behind More", () => {
    expect(aheadOf(sectionsFor(false))).toEqual({ each: ["/", MY_TEAM, "/league", PREM_RESULTS, "/news", MORE], once: ["/players"] });
  });

  it("swap My Team for Live while football is on, as the bar does", () => {
    expect(aheadOf(sectionsFor(true)).each).toEqual(["/", "/matchday", "/league", PREM_RESULTS, "/news", MORE]);
  });
});

describe("the Prem entry", () => {
  const prem = SECTIONS.find((section) => section.label === "Prem");

  // Craig, 24 Sep 2026: "clicking prem tab, default should land on results".
  it("lands on the results", () => {
    expect(prem?.href).toBe(PREM_RESULTS);
  });

  it("stays current across the whole section, the table included", () => {
    for (const path of [PREM, PREM_RESULTS, `${PREM}/fixtures`, `${PREM}/club/43`]) {
      expect(owns(prem?.routes ?? [], path)).toBe(true);
    }
  });
});
