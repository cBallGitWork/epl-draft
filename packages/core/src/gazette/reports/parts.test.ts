import { describe, expect, it } from "vitest";
import { PALMER, SAKA, deskOf, matchInput, moment } from "./__fixtures__/built";
import { partFaults } from "./parts";

const tableFaults = (account: string) => {
  const out: string[] = [];
  const desk = deskOf(matchInput([SAKA, PALMER], [moment("85", "goal", [1, null])], [1, 0]));
  partFaults(9001, { standfirst: "", account, sections: [] }, desk, (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
  return out.filter((fault) => fault.startsWith("the table"));
};

describe("partFaults' table", () => {
  it("keeps a place in the table out of the account", () => {
    expect(tableFaults("Arsenal are 4th.")).toEqual(["the table belongs to the standfirst, once: 4th"]);
  });

  it("never reads an ordinal with a noun as a place", () => {
    expect(tableFaults("Saka scored his 12th goal of the season.")).toEqual([]);
    expect(tableFaults("Saka's 85th-minute shot settled it.")).toEqual([]);
  });
});
