import { describe, expect, it } from "vitest";
import {
  CREDITS,
  MORE,
  SECTIONS,
  barSections,
  moreOwns,
  overflowSections,
  owns,
  sectionsFor,
} from "./sections";
import { MY_TEAM, SQUAD } from "../../squad/routes";

// The section table's one piece of logic is `owns`, and the plate it decides is
// the only thing on the rail a reader can be standing in without the pathname
// saying so. A rival's squad and the reader's own are the same five screens
// under the same folder, told apart by one segment — so the test is that the
// segment is doing the work, not the prefix.

/** A Fantrax team id, which is sixteen characters of base-36. */
const RIVAL = "1b6gp5utmtj36y3g";

const myTeam = SECTIONS.find((section) => section.href === MY_TEAM);

describe("the My Team plate", () => {
  it("is a section", () => {
    // `Team`, because the plate at 320 has 49.3px of label room and `My Team`
    // renders at 51. The section's NAME is longer than the word on its plate.
    expect(myTeam?.label).toBe("Team");
  });

  it("lights on every one of the reader's own tabs", () => {
    for (const tab of ["", "/transfers", "/next", "/fixtures", "/stats"]) {
      expect(owns(myTeam?.routes ?? [], `${MY_TEAM}${tab}`)).toBe(true);
    }
  });

  // The failure this exists for: `routes: ["/squad"]` would prefix-match every
  // team in the league, so browsing a rival would light a plate reading My Team.
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

  it("carries My Team midweek, when Live does not exist", () => {
    const sections = sectionsFor(false);
    expect(labels(barSections(sections))).toEqual(["Gazetta", "Team", "League", "Prem", "Mail"]);
    expect(labels(overflowSections(sections))).toEqual(["Find", "FPL"]);
  });

  it("gives Live My Team's slot while football is on", () => {
    const sections = sectionsFor(true);
    expect(labels(barSections(sections))).toEqual(["Gazetta", "Live", "League", "Prem", "Mail"]);
    expect(labels(overflowSections(sections))).toEqual(["Team", "Find", "FPL"]);
  });

  // Six tabs at 320 leave 49px for a label: five sections and More.
  it("never asks a phone for more than six tabs", () => {
    for (const matchday of [false, true]) {
      expect(barSections(sectionsFor(matchday)).length).toBeLessThanOrEqual(5);
    }
  });

  it("gives every tab a glyph, in both states", () => {
    for (const matchday of [false, true]) {
      for (const section of barSections(sectionsFor(matchday))) expect(section.glyph).toBeDefined();
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
    for (const path of [MORE, CREDITS, SQUAD, "/players", "/fpl"]) {
      expect(moreOwns(sections, path)).toBe(true);
    }
  });

  it("stays dark on a rival's squad and on a section with its own tab", () => {
    const sections = sectionsFor(false);
    for (const path of [`${SQUAD}/${RIVAL}`, MY_TEAM, "/league", "/news"]) {
      expect(moreOwns(sections, path)).toBe(false);
    }
  });

  it("takes My Team while football is on, since Team has no tab then", () => {
    expect(moreOwns(sectionsFor(true), MY_TEAM)).toBe(true);
  });
});
