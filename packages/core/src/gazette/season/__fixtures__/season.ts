import type { Availability } from "../../../football/playerState";
import type { CallMan } from "../calls";
import type { PlayedSeason } from "../play";
import type { SeasonOutcome } from "../simulate";

// A four-side season the desk has already played: Albion top, Rovers last, every side two men deep.

export const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };
export const INJURED: Availability = { state: "injured", label: "Injured", out: true, chance: 0, news: "Hamstring" };

export const man = (fantraxId: string, name: string, club: string, season: number, overall: number | null, availability = FIT): CallMan => ({
  fantraxId,
  name,
  club,
  season,
  availability,
  overall,
});

const row = (teamId: string, name: string, meanPlace: number, placed: number[]): SeasonOutcome => ({ teamId, name, meanPlace, placed });

/** Best expected place first, as `simulateSeason` returns it, out of 100 playings. */
export const PLAYED: PlayedSeason = {
  table: [
    row("a", "Albion", 1.4, [70, 20, 10, 0]),
    row("u", "United", 2.6, [20, 50, 25, 5]),
    row("c", "City", 2.9, [10, 20, 40, 30]),
    row("r", "Rovers", 3.1, [0, 10, 25, 65]),
  ],
  lines: new Map([
    ["a", { G: 90, D: 300, M: 400, F: 250 }],
    ["u", { G: 110, D: 280, M: 380, F: 200 }],
    ["c", { G: 100, D: 260, M: 300, F: 260 }],
    ["r", { G: 95, D: 250, M: 390, F: 150 }],
  ]),
  short: [],
};

export const SQUADS = new Map<string, CallMan[]>([
  ["a", [man("a1", "Erling Haaland", "Manchester City", 200, 2), man("a2", "Bukayo Saka", "Arsenal", 210, 7)]],
  ["u", [man("u1", "Bruno Fernandes", "Manchester United", 180, 1, INJURED), man("u2", "Cole Palmer", "Chelsea", 170, 6)]],
  ["c", [man("c1", "Mohamed Salah", "Liverpool", 190, 3), man("c2", "Jarrod Bowen", "West Ham United", 175, 8)]],
  ["r", [man("r1", "Alexander Isak", "Liverpool", 150, 4), man("r2", "Danny Welbeck", "Brighton & Hove Albion", 160, 5)]],
]);
