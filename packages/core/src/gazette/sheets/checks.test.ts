import { describe, expect, it } from "vitest";
import { buildSheetsBrief } from "../briefs/sheets";
import { checkSheets } from "./checks";
import { mergeSheets, readSheetsDraft } from "./draft";
import { sheetsFacts, type TieFacts } from "./facts";
import { side } from "./__fixtures__/sides";

const HOME = ["Raya:G:1", "Saliba:D:1", "Rice:M:1", "Haaland:F:11"];
const AWAY = ["Pickford:G:12", "Gabriel:D:1", "Saka:M:1", "Isak:F:5"];

function round(history = true): TieFacts[] {
  return sheetsFacts({
    pairings: [{ home: { teamId: "h" }, away: { teamId: "w" } }],
    sheets: new Map([["h", side("h", HOME, ["Eze:M:8"])], ["w", side("w", AWAY)]]),
    history: history ? new Map([["h", [side("h", [...HOME.slice(0, 3), "Eze:M:8"])]], ["w", [side("w", AWAY)]]]) : new Map(),
    fixtures: [{ homeClubId: 11, awayClubId: 12 }],
    lastWrote: new Map([["w", "Team w name an unchanged side with Saka on the right."]]),
    playing: new Set([1, 5, 8, 11, 12]),
    news: () => null,
    recent: () => [],
    predicted: () => null,
  });
}

function check(draft: Record<string, string>, ties = round()) {
  const facts = buildSheetsBrief({ gameweek: 6, ties, clubName: (id) => `Club ${id}`, fixture: () => null });
  return checkSheets(new Map(Object.entries(draft)), { ties, facts }).map((fault) => [fault.section, fault.check, fault.severity]);
}

const GOOD = { h: "Team h make one change, with Haaland in for Eze and up against Pickford.", w: "Team w are unchanged." };

describe("checkSheets", () => {
  it("passes a plain report of the facts", () => {
    expect(check(GOOD)).toEqual([]);
  });

  it("refuses the wrong count of changes, a debut nobody made, and unchanged on a changed side", () => {
    expect(check({ ...GOOD, h: "Team h make two changes." })).toContainEqual(["h", "the wrong number of changes", "hard"]);
    expect(check({ ...GOOD, w: "Saka makes his debut for Team w." })).toContainEqual(["w", "a debut the brief does not give", "hard"]);
    expect(check({ ...GOOD, h: "Team h are unchanged." })).toContainEqual(["h", "unchanged when it changed", "hard"]);
    expect(check({ ...GOOD, w: "Team w are unchanged, and Saka drops to the bench." })).toContainEqual(["w", "a man dropped the brief does not give", "hard"]);
    expect(check({ ...GOOD, h: "Team h make one change, with Eze dropped to the bench for Haaland." }).map((fault) => fault[1])).not.toContain("a man dropped the brief does not give");
  });

  it("refuses any change on a first sheet, and a man the brief never named", () => {
    expect(check({ h: "Team h make one change.", w: "Team w start Isak." }, round(false))).toContainEqual(["h", "changes on a first sheet", "hard"]);
    expect(check({ ...GOOD, w: "Team w start Salah." })).toContainEqual(["w", "a name not in the brief", "hard"]);
  });

  it("sends back opinion, a repeated opening, and a phrase from last round", () => {
    expect(check({ ...GOOD, h: "Team h make a bold call with one change." })).toContainEqual(["h", "opinion or banned phrasing", "send-back"]);
    expect(check({ ...GOOD, w: "Team h make one change." }).map((fault) => fault[1])).toContain("opens like another side's paragraph");
    expect(check({ ...GOOD, w: "Team w name an unchanged side with Saka on the right." })).toContainEqual(["w", "a phrase from last round's article", "send-back"]);
  });

  it("refuses a source or a percentage, and sends back a count of unchanged gameweeks", () => {
    expect(check({ ...GOOD, w: "Team w start Saka, projected to play." })).toContainEqual(["w", "names a source or a percentage", "hard"]);
    expect(check({ ...GOOD, w: "Team w start Saka at 75%." })).toContainEqual(["w", "names a source or a percentage", "hard"]);
    expect(check({ ...GOOD, w: "Team w are unchanged for a sixth week." })).toContainEqual(["w", "counts the gameweeks", "send-back"]);
  });

  it("sends back American terms and a team-news phrase used too often", () => {
    expect(check({ ...GOOD, w: "Team w start Saka while Eze sits." })).toContainEqual(["w", "not British football English", "send-back"]);
    expect(check({ ...GOOD, w: "Team w are unchanged, and Eze has recognized the defense." })).toContainEqual(["w", "not British football English", "send-back"]);
    expect(check({ ...GOOD, w: "Team w are unchanged, and Eze is benched with a goal to his name." })).toContainEqual(["w", "a stock phrase no reporter uses", "send-back"]);
    expect(check({ ...GOOD, w: "Team w are unchanged, Saka with a goal in his last three rounds." })).toContainEqual(["w", "say gameweeks, not rounds", "send-back"]);
    expect(check({ ...GOOD, w: "Team w start Saka, and Eze is benched when he might have started." })).toContainEqual(["w", "the wrong tense: the match is still to come", "send-back"]);
    const twice = { ...GOOD, h: "Team h make one change, and Haaland comes into the side.", w: "Team w are unchanged, and Isak comes into the side." };
    expect(check(twice)).toContainEqual(["article", "a phrase used too often", "send-back"]);
  });

});

describe("the draft", () => {
  it("reads the reply by team id and tidies the punctuation", () => {
    const draft = readSheetsDraft({ ties: [{ homeTeamId: "h", awayTeamId: "w", home: "Team h make one change — Haaland.", away: "" }] }, round());
    expect(draft.get("h")).toBe("Team h make one change, Haaland.");
    expect(draft.has("w")).toBe(false);
  });

  it("keeps each section's first clean attempt, then its last with no hard fault, then nothing", () => {
    const fault = (section: string, severity: "hard" | "send-back") => ({ section, check: "x", severity, evidence: "" });
    const first = { draft: new Map([["h", "first h"], ["w", "first w"], ["k", "first k"]]), faults: [fault("w", "send-back"), fault("k", "hard")] };
    const second = { draft: new Map([["h", "second h"], ["w", "second w"], ["k", "second k"]]), faults: [fault("w", "send-back"), fault("k", "hard")] };
    expect([...mergeSheets([first, second])]).toEqual([["h", "first h"], ["w", "second w"]]);
  });
});
