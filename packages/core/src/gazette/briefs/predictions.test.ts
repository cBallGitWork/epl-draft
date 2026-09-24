import { describe, expect, it } from "vitest";
import type { Availability } from "../../football/playerState";
import { PAST } from "../predictions/past";
import { callTie } from "../predictions/pick";
import type { PredictionRecord } from "../predictions/record";
import { predictionSide, type SquadMan } from "../predictions/sides";
import { buildLawroBrief, type PredictionsTie } from "./predictions";

const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };

const man = (name: string, horizon: number, over: Partial<SquadMan> = {}): SquadMan => ({
  name,
  club: "Arsenal",
  positions: ["M"],
  horizon,
  availability: FIT,
  fixtures: [{ opponent: "Leeds United", home: true }],
  ease: 5,
  liverpool: false,
  ...over,
});

const side = (teamId: string, name: string, projected: number | null, men: SquadMan[]) =>
  predictionSide({
    teamId,
    name,
    projected,
    men,
    hardest: 20,
    arrivals: [],
    form: { rank: 2, won: 2, drawn: 0, lost: 0, points: 6, last: null, run: "WW" },
  });

const tie = (home: ReturnType<typeof side>, away: ReturnType<typeof side>): PredictionsTie => ({
  home,
  away,
  call: callTie(home, away),
});

const FIRST: PredictionRecord = { last: null, season: { all: null, gut: null } };

const brief = (ties: PredictionsTie[], record: PredictionRecord = FIRST) =>
  buildLawroBrief({
    gameweek: 7,
    locksAt: "2026-10-17T11:15:00.000Z",
    teams: [
      { teamId: "cp", name: "Cold Palmer" },
      { teamId: "hg", name: "Haaland Globetrotters" },
    ],
    ties,
    record,
    past: [],
    threads: [],
  });

const doubtful: Availability = { state: "doubt", label: "50%", out: false, chance: 50, news: "Groin injury - 50% chance of playing" };

describe("buildLawroBrief", () => {
  const palmer = man("Palmer", 30, { availability: doubtful, club: "Chelsea" });
  const clear = tie(side("cp", "Cold Palmer", 52.1, [man("Saka", 20)]), side("hg", "Haaland Globetrotters", 41.6, [man("Haaland", 25)]));
  const gut = tie(side("cp", "Cold Palmer", 43.6, [palmer, man("Saka", 20)]), side("hg", "Haaland Globetrotters", 41.2, [man("Haaland", 25)]));

  it("hands him every call already made, and never a total, a score or a figure", () => {
    const text = brief([clear]) ?? "";
    expect(text).toContain("YOUR CALL: Cold Palmer.");
    expect(text).toContain('"backs" "cp"');
    for (const withheld of ["52.1", "41.6", "52", "42", "20", "25"]) expect(text).not.toMatch(new RegExp(`\\b${withheld.replace(".", "\\.")}\\b`));
  });

  it("tells him why he goes against the favourite, and only that", () => {
    const text = brief([gut]) ?? "";
    expect(text).toContain("YOUR CALL: Haaland Globetrotters. A GUT CALL");
    expect(text).toContain("Cold Palmer are the favourites");
    expect(text).toContain("T1-gut: Cold Palmer's best man, Palmer");
    expect(text).toContain("FPL gives him 50 per cent");
    // FPL's note without its dash, which he is not allowed to print.
    expect(text).toContain("FPL's note: Groin injury, 50% chance of playing");
  });

  it("says nothing of line-ups, the numbers or a computer", () => {
    const text = (brief([clear, gut]) ?? "").replace("who starts, who is picked, who is left out or who is on anybody's bench", "");
    expect(text).not.toMatch(/\b(?:ACTIVE|RESERVE|bench|benched|starting|computer|the numbers|projection)\b/i);
  });

  it("gives the Liverpool count only when that instinct called the tie", () => {
    const reds = (name: string) => man(name, 10, { liverpool: true, club: "Liverpool" });
    const loyal = tie(
      side("cp", "Cold Palmer", 45, [man("Saka", 20)]),
      side("hg", "Haaland Globetrotters", 43, [man("Haaland", 25), reds("Salah"), reds("Gakpo")]),
    );
    expect(loyal.call.instinct).toBe("liverpool");
    expect(brief([loyal])).toContain("Liverpool men in the squad: Haaland Globetrotters 2 (Gakpo, Salah), Cold Palmer 0");
    expect(brief([clear])).not.toContain("Liverpool men");
  });

  it("owns last week's marks, and withholds the season the page prints", () => {
    const record: PredictionRecord = {
      last: {
        gameweek: 6,
        marks: {
          all: { right: 3, called: 5 },
          gut: { right: 0, called: 1 },
          misses: [{ gameweek: 6, calledTeamId: "cp", winnerTeamId: "hg", loserTeamId: "cp", winnerPoints: 49, loserPoints: 41, gut: true }],
        },
      },
      season: { all: { right: 3, called: 5 }, gut: { right: 0, called: 1 } },
    };
    const text = brief([clear], record) ?? "";
    expect(text).toContain("Gameweek 6: 3 right from 5. Your gut calls: 0 from 1.");
    expect(text).toContain("You had Cold Palmer on a gut call. Haaland Globetrotters beat Cold Palmer 49-41.");
    expect(text).toContain("never recite it");
  });

  it("invents no record for a first column", () => {
    expect(brief([clear])).toContain("there is no record yet");
  });

  it("offers his past only as given, and files nothing it cannot call", () => {
    const withPast = buildLawroBrief({ gameweek: 7, locksAt: "2026-10-17T11:15:00.000Z", teams: [], ties: [clear], record: FIRST, past: [PAST[3]], threads: [] });
    expect(withPast).toContain(`- ${PAST[3].line}`);
    const uncalled = tie(side("cp", "Cold Palmer", null, []), side("hg", "Haaland Globetrotters", 40, []));
    expect(brief([uncalled])).toBeNull();
  });
});
