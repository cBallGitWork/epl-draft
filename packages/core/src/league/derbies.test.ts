import { describe, expect, it } from "vitest";
import { derbyBrief, derbyOf, type Derby } from "./derbies";

// Three of Craig's, 8 Oct 2026: a pair with two names, a trio, and a pair inside that trio with a name of its own.
const derbies: Derby[] = [
  { teams: ["algie", "traf"], names: ["Battle of York", "Sacking of York"] },
  { teams: ["fellows", "ohi", "dome"], names: ["Milan Derby"], why: "all of them live in Milan" },
  { teams: ["ohi", "fellows"], names: ["Mikel Arteta Appreciation Match"] },
];

describe("derbyOf", () => {
  it("names a pair's derby either way round, with what else it is called", () => {
    const york = { name: "Battle of York", also: ["Sacking of York"], why: [] };
    expect(derbyOf(derbies, "algie", "traf")).toEqual(york);
    expect(derbyOf(derbies, "traf", "algie")).toEqual(york);
  });

  it("finds any two of a group's teams, and says why", () => {
    expect(derbyOf(derbies, "dome", "ohi")).toEqual({ name: "Milan Derby", also: [], why: ["all of them live in Milan"] });
  });

  it("puts a pair's own name before a group's", () => {
    expect(derbyOf(derbies, "fellows", "ohi")).toEqual({
      name: "Mikel Arteta Appreciation Match",
      also: ["Milan Derby"],
      why: ["all of them live in Milan"],
    });
  });

  it("names nothing for teams that have no derby, or a team against itself", () => {
    expect(derbyOf(derbies, "algie", "ohi")).toBeNull();
    expect(derbyOf(derbies, "ohi", "ohi")).toBeNull();
  });
});

describe("derbyBrief", () => {
  it("tells the writer the name, what else it is called and why, with one article", () => {
    expect(derbyBrief({ name: "Mikel Arteta Appreciation Match", also: ["Milan Derby"], why: ["all of them live in Milan"] })).toBe(
      "THE DERBY: this meeting is the Mikel Arteta Appreciation Match, also called the Milan Derby. Why it is one: all of them live in Milan. The page prints its name above your words; name it once at most, exactly as written.",
    );
    expect(derbyBrief({ name: "The Paul Bunyan Axe", also: [], why: [] })).toMatch(/^THE DERBY: this meeting is The Paul Bunyan Axe\. The page/u);
  });
});
