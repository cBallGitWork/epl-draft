import { describe, expect, it } from "vitest";
import { spursVilla } from "./__fixtures__/spursVilla";
import { starMan } from "./star";
import { matchEvents } from "./timeline";

const match = spursVilla();
const code = (name: string) => match.men.find((m) => m.name.endsWith(name))!.code;
const events = matchEvents(match);

describe("starMan", () => {
  it("names the best mark of everyone who played, with what he did", () => {
    const marks = new Map([[code("Jackson"), 8.4], [code("Manzambi"), 8.9], [code("Kinsky"), 4.1]]);
    expect(starMan({ ...match, marks }, events)).toMatchObject({ name: "Manzambi", mark: 8.9, did: "1 goal, 1 assist" });
  });

  it("passes over a man too brief to rate, and names nobody when nobody was rated", () => {
    expect(starMan({ ...match, marks: new Map([[code("Jackson"), null]]) }, events)).toBeNull();
    expect(starMan(match, events)).toBeNull();
  });
});
