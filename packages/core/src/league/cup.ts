import type { Competition, SeededRound } from "./competitions";

// The first cup: every team, double elimination, seeded on gameweek 9's points, final on gameweek 17.
// A tie is decided by that gameweek's Fantrax totals; level on points, the higher seed goes through.

export const CUP: Competition = { id: "cup", name: "Cup", seededBy: { gameweek: 9 } };

const round = (gameweek: number, name: string, ties: SeededRound["ties"]): SeededRound => ({
  competition: CUP,
  gameweek,
  name,
  ties,
});

/** In gameweek order. A tie id is what a later side prints ("Winner QF1"), so it stays short enough for a phone. */
export const CUP_ROUNDS: readonly SeededRound[] = [
  round(10, "Opening round", [
    { id: "OR1", home: 7, away: 10 },
    { id: "OR2", home: 8, away: 9 },
  ]),
  round(11, "Quarter-finals", [
    { id: "QF1", home: 1, away: { winner: "OR2" } },
    { id: "QF2", home: 4, away: 5 },
    { id: "QF3", home: 2, away: { winner: "OR1" } },
    { id: "QF4", home: 3, away: 6 },
  ]),
  // The losers of quarter-finals 2 and 4 (seeds 3–6 among them) sit this round out.
  round(12, "Losers' round 1", [
    { id: "L1", home: { loser: "QF1" }, away: { loser: "OR1" } },
    { id: "L2", home: { loser: "QF3" }, away: { loser: "OR2" } },
  ]),
  round(13, "Semi-finals", [
    { id: "SF1", home: { winner: "QF1" }, away: { winner: "QF2" } },
    { id: "SF2", home: { winner: "QF3" }, away: { winner: "QF4" } },
  ]),
  round(13, "Losers' round 2", [
    { id: "L3", home: { loser: "QF4" }, away: { winner: "L1" } },
    { id: "L4", home: { loser: "QF2" }, away: { winner: "L2" } },
  ]),
  round(14, "Losers' round 3", [
    { id: "L5", home: { loser: "SF1" }, away: { winner: "L3" } },
    { id: "L6", home: { loser: "SF2" }, away: { winner: "L4" } },
  ]),
  round(15, "Winners' final", [
    { id: "WF", home: { winner: "SF1" }, away: { winner: "SF2" } },
  ]),
  round(15, "Losers' semi-final", [
    { id: "LSF", home: { winner: "L5" }, away: { winner: "L6" } },
  ]),
  round(16, "Losers' final", [
    { id: "LF", home: { loser: "WF" }, away: { winner: "LSF" } },
  ]),
  round(17, "Final", [
    { id: "F", home: { winner: "WF" }, away: { winner: "LF" } },
  ]),
];
