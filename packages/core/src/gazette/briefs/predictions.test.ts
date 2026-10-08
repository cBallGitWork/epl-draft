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
  fixtures: [{ opponent: "Leeds United", home: true, standing: null }],
  ease: 10,
  liverpool: false,
  recent: [],
  face: { code: horizon, name, clubId: 1, position: null },
  ...over,
});

const side = (teamId: string, name: string, projected: number | null, men: SquadMan[], worn: ReadonlySet<string> = new Set()) =>
  predictionSide({
    teamId,
    name,
    projected,
    men,
    hardest: 20,
    arrivals: [],
    form: { rank: 2, won: 2, drawn: 0, lost: 0, points: 6, last: null, run: "WW" },
    worn,
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
    // In words, and FPL's note without its figure.
    expect(text).toContain("is a doubt. FPL's note: Groin injury.");
    expect(text).not.toMatch(/per cent|%|\b50\b/u);
  });

  it("leads the tie with a main man's difficult game, said plainly, then one man for the other side", () => {
    const liverpool = { opponent: "Liverpool", home: false, standing: "a tough defence to score against" };
    const haaland = man("Haaland", 30, { club: "Manchester City", positions: ["F"], ease: 19, fixtures: [liverpool] });
    const text = brief([tie(side("cp", "Cold Palmer", 52.1, [man("Saka", 20)]), side("hg", "Haaland Globetrotters", 41.6, [haaland, man("Isak", 10)]))]) ?? "";
    const facts = text.split("\n").filter((line) => line.startsWith("- T1"));
    expect(facts[0]).toBe("- T1-story: Haaland Globetrotters's Haaland, one of their main men, has a difficult one: away at Liverpool, a tough defence to score against.");
    expect(text).not.toMatch(/hardest/u);
    // Then one man for the side the story leaves out, never a roll call of every man and fixture.
    expect(facts.filter((line) => line.includes("-man:"))).toEqual([expect.stringContaining("T1H-man: Saka (M, Arsenal, home to Leeds United), for Cold Palmer.")]);
  });

  it("puts a main man's easy game before a difficult one, and marks the other side's easy man", () => {
    const hull = { opponent: "Hull City", home: true, standing: "a soft defence" };
    const haaland = man("Haaland", 30, { club: "Manchester City", positions: ["F"], ease: 19, fixtures: [{ opponent: "Liverpool", home: false, standing: null }] });
    const text = brief([tie(side("cp", "Cold Palmer", 52.1, [man("Saka", 20, { ease: 2, fixtures: [hull] }), man("Rice", 19)]), side("hg", "Haaland Globetrotters", 41.6, [haaland, man("Isak", 10, { ease: 3, fixtures: [hull] })]))]) ?? "";
    expect(text).toContain("- T1-story: Cold Palmer's Saka, one of their main men, has an easy one: home to Hull City, a soft defence.");
    expect(text).toContain("- T1A-man: Isak (M, Arsenal, home to Hull City, a soft defence), for Haaland Globetrotters, an easy one.");
  });

  it("reads a man's last two games: form, a quiet spell, a return, and a back line's clean sheets", () => {
    const game = (goals: number, assists = 0, minutes = 90, cleanSheets = 0) => ({ gameweek: 5, minutes, goals, assists, cleanSheets, points: 2 });
    const hot = man("Saka", 20, { recent: [game(1), game(2)] });
    const text = brief([tie(side("cp", "Cold Palmer", 52.1, [hot, man("Rice", 19, { recent: [game(0), game(0)] })]), side("hg", "Haaland Globetrotters", 41.6, [man("Haaland", 25, { recent: [game(0, 0, 0), game(0, 0, 0)] }), man("Gabriel", 9, { positions: ["D"], recent: [game(0, 0, 90, 1), game(0, 0, 90, 1)] })]))]) ?? "";
    expect(text).toContain("- T1-story: Cold Palmer's Saka (Arsenal), one of their main men, scored in each of his last two games.");
    expect(text).toContain("T1H-run: Cold Palmer's Rice (Arsenal) has gone quiet, no goal and no assist in his last two games.");
    expect(text).toContain("T1A-man: Haaland (M, Arsenal, home to Leeds United), for Haaland Globetrotters. He is fit again after missing his last two games.");
    expect(text).toContain("T1A-run: Haaland Globetrotters's Gabriel (Arsenal) kept a clean sheet in each of his last two games.");
  });

  it("names two men from one club, and two men whose clubs meet this round", () => {
    const leeds = { opponent: "Arsenal", home: false, standing: null };
    const pair = tie(
      side("cp", "Cold Palmer", 52.1, [man("Saka", 20), man("Rice", 19)]),
      side("hg", "Haaland Globetrotters", 41.6, [man("Haaland", 25, { club: "Manchester City", fixtures: [{ opponent: "Leeds United", home: true, standing: null }] }), man("Ampadu", 8, { club: "Leeds United", fixtures: [leeds] })]),
    );
    const text = brief([pair]) ?? "";
    expect(text).toContain("T1-club: Cold Palmer's Saka and Rice both play for Arsenal.");
    expect(text).toContain("T1-meet: Saka (Cold Palmer, Arsenal) and Ampadu (Haaland Globetrotters, Leeds United) play against each other this round.");
    expect(brief([clear])).not.toMatch(/-club:|-meet:/u);
  });

  it("says how likely a man is to play in words, by FPL's chance or its status", () => {
    const at = (chance: number | null, state: Availability["state"] = "doubt"): Availability => ({ state, label: "", out: state !== "doubt" || chance === 0, chance, news: "" });
    const alone = (name: string, availability: Availability) =>
      tie(side("cp", "Cold Palmer", 52.1, [man(name, 30, { availability })]), side("hg", "Haaland Globetrotters", 41.6, [man("Haaland", 25)]));
    const text = brief([alone("Rice", at(75)), alone("Odegaard", at(25)), alone("Gabriel", at(null, "injured")), alone("Timber", at(0))]) ?? "";
    for (const said of ["Rice (Arsenal) is a slight doubt.", "Odegaard (Arsenal) is a big doubt.", "Gabriel (Arsenal) is injured.", "Timber (Arsenal) is out."]) {
      expect(text).toContain(said);
    }
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
    expect(brief([loyal])).toContain("Liverpool men in the squad: Haaland Globetrotters 2, Cold Palmer 0. Haaland Globetrotters's: Gakpo (M, Liverpool, home to Leeds United); Salah (M, Liverpool, home to Leeds United).");
    expect(brief([loyal])).toContain("never give their club as the reason");
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

  it("leaves out a man he has already written about, unless something is new for him", () => {
    const worn = new Set(["Saka", "Palmer"]);
    const again = tie(
      side("cp", "Cold Palmer", 52.1, [man("Saka", 20), palmer, man("Rice", 9, { fixtures: [{ opponent: "Leeds United", home: true, standing: "a soft defence" }] })], worn),
      side("hg", "Haaland Globetrotters", 41.6, [man("Haaland", 25)]),
    );
    const text = brief([again]) ?? "";
    // Saka is the same story as last week; Palmer is a doubt, which is new.
    expect(text).not.toContain("Saka");
    expect(text).toContain("Cold Palmer's Palmer (Chelsea) is a doubt");
  });

  it("invents no record for a first column", () => {
    expect(brief([clear])).toContain("there is no record to own yet");
  });

  it("offers his past only as given, and files nothing it cannot call", () => {
    const withPast = buildLawroBrief({ gameweek: 7, locksAt: "2026-10-17T11:15:00.000Z", teams: [], ties: [clear], record: FIRST, past: [PAST[3]] });
    expect(withPast).toContain(`- ${PAST[3].line}`);
    const uncalled = tie(side("cp", "Cold Palmer", null, []), side("hg", "Haaland Globetrotters", 40, []));
    expect(brief([uncalled])).toBeNull();
  });
});

describe("a derby in Lawro's brief", () => {
  it("names the derby straight under its tie's heading, and says nothing for a tie that is not one", () => {
    const [home, away] = [side("cp", "Cold Palmer", 60, [man("Saka", 9)]), side("hg", "Haaland Globetrotters", 50, [man("Rice", 8)])];
    const derby = { name: "Tim Hortons Derby", also: [], why: [] };
    const lines = brief([{ ...tie(home, away), derby }])?.split("\n") ?? [];
    const heading = lines.findIndex((line) => line.startsWith("TIE 1 of 1"));
    expect(lines[heading + 1]).toMatch(/^THE DERBY: this meeting is the Tim Hortons Derby\./u);
    expect(brief([tie(home, away)])).not.toContain("THE DERBY");
  });
});
