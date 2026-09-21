import { describe, expect, it } from "vitest";
import { SECTIONS, barSections, overflowSections, owns, sectionsFor } from "./sections";
import { MY_TEAM } from "../../squad/routes";

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
    expect(myTeam?.label).toBe("My Team");
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
    expect(labels(barSections(sections))).toEqual(["Gazetta", "My Team", "League", "Prem", "News"]);
    expect(labels(overflowSections(sections))).toEqual(["Find", "FPL"]);
  });

  it("stands My Team down while football is on, and Live takes the plate", () => {
    const sections = sectionsFor(true);
    expect(labels(barSections(sections))).toEqual(["Gazetta", "League", "Prem", "Live", "News"]);
    expect(labels(overflowSections(sections))).toContain("My Team");
  });

  // The measured ceiling, as a test rather than a comment: `navfit` at 320 gives
  // six plates 53px each and a seventh 45, which clips a 51px label. Five
  // sections plus the door is six, and this is what stops the seventh arriving
  // by way of a table nobody re-measured.
  it("never asks a phone for more than six plates", () => {
    for (const matchday of [false, true]) {
      expect(barSections(sectionsFor(matchday)).length).toBeLessThanOrEqual(5);
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
