import type { PeriodPairing } from "./selectors";
import type { LeagueTeam, StandingsRow } from "./types";

// What is on in a gameweek, across every competition the league runs.
//
// Fantrax describes exactly one — the head-to-head league whose pairings arrive
// on `getLeagueInfo` — and has no vocabulary for a second. A cup and a playoff
// are ours, so they are declared here as data and resolved purely, the same way
// every other league rule is data rather than an assumption.
//
// **The knockouts below are a placeholder and say so on screen.** The rounds and
// the gameweeks they fall in are invented; what is real is the shape — one
// gameweek can hold ties from more than one competition, which the schedule had
// no way to express while the league's own fixtures were the only thing on it.
// When the commissioner settles a real cup, this declaration is what changes.

export interface Competition {
  id: string;
  name: string;
}

/** Fantrax's own competition: the one it actually scores. */
export const LEAGUE_COMPETITION: Competition = { id: "league", name: "League" };

const CUP: Competition = { id: "cup", name: "Cup" };
const PLAYOFFS: Competition = { id: "playoffs", name: "Playoffs" };

/** One side of a declared tie, before anyone is drawn into it.
 *
 *  A number is a place in the table — 1 is whoever is top when the round comes
 *  round. A string is a side the table cannot name, printed verbatim: a
 *  semi-final winner is not a table position, and seeding one would put a team
 *  in a final it has not reached. */
export type Seed = number | string;

export interface SeededRound {
  competition: Competition;
  gameweek: number;
  /** "Semi-finals", "Final". */
  name: string;
  ties: readonly (readonly [Seed, Seed])[];
}

/** Every competition, in reading order. The league's own leads because it is the
 *  one being played. */
export const COMPETITIONS: readonly Competition[] = [LEAGUE_COMPETITION, CUP, PLAYOFFS];

/** The invented calendar. Two cup rounds in consecutive gameweeks, and a playoff
 *  final on the last day between the top two — a dummy bracket whose only job is
 *  to prove a gameweek can carry more than one competition.
 *
 *  It does NOT decide the table's cut any more, and that is the correction worth
 *  keeping. This file used to derive the season's qualifying places from the
 *  bracket below, on the reasoning that one declaration is better than two — but
 *  the declaration was invented, and Fantrax publishes the real one on
 *  `getLeagueInfo`. Ours is a top four from period 35; the bracket says a final
 *  between first and second, so the table drew a top two. A placeholder may
 *  stand in for a fixture nobody has settled. It may not stand in for a setting
 *  the provider already answered. */
export const PLACEHOLDER_ROUNDS: readonly SeededRound[] = [
  { competition: CUP, gameweek: 4, name: "Semi-finals", ties: [[1, 4], [2, 3]] },
  {
    competition: CUP,
    gameweek: 5,
    name: "Final",
    ties: [["Winner, semi-final 1", "Winner, semi-final 2"]],
  },
  { competition: PLAYOFFS, gameweek: 38, name: "Final", ties: [[1, 2]] },
];


export interface TieSide {
  /** Null while the draw cannot name a team — an empty table, or a side that is
   *  won rather than seeded. */
  team: LeagueTeam | null;
  /** What to print: the team's name once there is one, else the draw's own words
   *  for this side. */
  label: string;
}

export interface CompetitionTie {
  competition: Competition;
  /** Null for the league's own fixtures. A league week has no round name, and
   *  inventing "Matchday 4" would be labelling Fantrax's schedule with a word
   *  Fantrax does not use. */
  round: string | null;
  home: TieSide;
  away: TieSide;
}

/** Fantrax's pairings, as ties. Both sides are already teams, so nothing is
 *  drawn and nothing can be missing. */
export function leagueTies(pairings: readonly PeriodPairing[]): CompetitionTie[] {
  return pairings.map((pairing) => ({
    competition: LEAGUE_COMPETITION,
    round: null,
    home: { team: pairing.home, label: pairing.home.name },
    away: { team: pairing.away, label: pairing.away.name },
  }));
}

/** The declared knockouts falling in one gameweek, drawn against the table as it
 *  stands.
 *
 *  Provisional by construction, and that is the honest reading of a bracket: the
 *  playoff final is between whoever finishes first and second, and until the
 *  season is over nobody knows who that is. A league with no table draws nobody
 *  and prints the places instead. */
export function seededTies(
  rounds: readonly SeededRound[],
  table: readonly StandingsRow[],
  gameweek: number,
): CompetitionTie[] {
  return rounds
    .filter((round) => round.gameweek === gameweek)
    .flatMap((round) =>
      round.ties.map((tie) => ({
        competition: round.competition,
        round: round.name,
        home: drawn(tie[0], table),
        away: drawn(tie[1], table),
      })),
    );
}

function drawn(seed: Seed, table: readonly StandingsRow[]): TieSide {
  if (typeof seed === "string") return { team: null, label: seed };

  const row = table.find((entry) => entry.rank === seed);
  // A row with no name is no better than no row: printing an empty side would
  // read as a bye rather than as a place nobody holds yet.
  if (!row || row.teamName === "") return { team: null, label: ordinal(seed) };
  return { team: { teamId: row.teamId, name: row.teamName }, label: row.teamName };
}

const SUFFIX = ["th", "st", "nd", "rd"];

/** "1st", "2nd", "11th". */
function ordinal(place: number): string {
  const teens = place % 100;
  if (teens >= 11 && teens <= 13) return `${place}th`;
  return `${place}${SUFFIX[place % 10] ?? "th"}`;
}

/** One competition's ties in one gameweek, or one round of one competition's.
 *
 *  A gameweek can hold more than one competition at once — the whole reason the
 *  schedule stopped being a flat list of pairings — so what a reader needs is
 *  the ties boxed under the thing they are being played for. Ordered by
 *  `COMPETITIONS` rather than by whatever order the ties arrived in, so the
 *  league leads whether or not a cup happens to be on. */
export interface CompetitionGroup {
  competition: Competition;
  round: string | null;
  ties: CompetitionTie[];
}

export function groupTies(ties: readonly CompetitionTie[]): CompetitionGroup[] {
  const groups: CompetitionGroup[] = [];
  for (const competition of COMPETITIONS) {
    for (const tie of ties) {
      if (tie.competition.id !== competition.id) continue;
      const open = groups.find(
        (group) => group.competition.id === competition.id && group.round === tie.round,
      );
      if (open) open.ties.push(tie);
      else groups.push({ competition, round: tie.round, ties: [tie] });
    }
  }
  return groups;
}
