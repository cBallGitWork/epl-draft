import { describe, expect, it } from "vitest";
import { checkBin } from "./checks";

const brief = "THE BIN XI, gameweek 5. The eleven scored 83 points. Jay da Silva, Coventry City, D: 12 points. 90 minutes. A goal. Dropped by Timbeibs ahead of gameweek 3. Johan Manzambi, Aston Villa, M: 11 points. 4 shots, 2 on target.";
const ctx = { brief, names: ["Jay da Silva", "Johan Manzambi", "Timbeibs"] };

/** Three paragraphs of about sixty words each: long enough to pass the length check on its own. */
const filler = "The back line did the work that mattered and the midfield kept the ball when it had to, which is the least a side assembled from other people's leftovers can be asked to do on a Saturday afternoon in early autumn with nothing much riding on it at all, and nobody in the league will say otherwise until the next side is picked on a Tuesday morning.";
const body = (first: string) => [first, filler, filler].join("\n\n");
const faultsOf = (column: Record<string, unknown>) => checkBin({ headline: "Bin there, done that", deck: "", ...column }, ctx).map((f) => f.check);

describe("checkBin", () => {
  it("passes a clean column", () => {
    expect(faultsOf({ body: body("Jay da Silva scored and kept a clean sheet: 12 points for a defender Timbeibs let go.") })).toEqual([]);
  });

  it("refuses the market: the wire's ground and a tipster's", () => {
    expect(faultsOf({ body: body("Somebody should claim Jay da Silva before Wednesday.") })).toContain("the market is the wire's, and never advice");
  });

  it("refuses the desk's workings and the draft's round", () => {
    expect(faultsOf({ body: body("Johan Manzambi's xG told the story.") })).toContain("the desk's figures and the draft's round stay off the page");
    expect(faultsOf({ body: body("Timbeibs took him in the ninth round.") })).toContain("the desk's figures and the draft's round stay off the page");
  });

  it("refuses a source or a percentage", () => {
    expect(faultsOf({ body: body("FPL had him at 12.") })).toContain("names a source or a percentage");
  });

  it("refuses a figure and a name the brief does not give", () => {
    expect(faultsOf({ body: body("Jay da Silva had 7 shots.") })).toContain("a figure not in the brief");
    expect(faultsOf({ body: body("Bukayo Saka was nowhere.") })).toContain("a name not in the brief");
  });

  it("refuses a verdict on why nobody has him, and sends back the ownership words and a role", () => {
    expect(faultsOf({ headline: "The Clean Sheets Nobody Wanted", body: body("Jay da Silva scored.") })).toContain("why nobody has him is a verdict the facts cannot give");
    expect(faultsOf({ body: body("Johan Manzambi, owned by nobody.") })).toContain("a man is in a squad, never owned or held");
    expect(faultsOf({ body: body("Jay da Silva wide on the left.") })).toContain("a role the brief does not give");
    expect(faultsOf({ body: body("Jay da Silva held a clean sheet.") })).not.toContain("a man is in a squad, never owned or held");
    expect(faultsOf({ body: body("Timbeibs held him for a week.") })).toContain("a man is in a squad, never owned or held");
  });

  it("sends back a column of the wrong length", () => {
    expect(faultsOf({ body: "Jay da Silva scored." })).toContain("length");
  });
});
