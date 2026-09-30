import { CUP, CUP_ROUNDS } from "./cup";
import { ordinal } from "./ordinal";
import type { PeriodPairing } from "./selectors";
import type { LeagueTeam } from "./types";

// What is on in a gameweek, across every competition the league runs.
//
// Fantrax describes exactly one — the head-to-head league whose pairings arrive
// on `getLeagueInfo` — and has no vocabulary for a second. A cup and a playoff
// are ours, so they are declared as data and resolved purely, the same way
// every other league rule is data rather than an assumption. The cup is
// settled (`cup.ts`); the playoff final is still a placeholder and says so.

export interface Competition {
  id: string;
  name: string;
  /** Where a numbered seed comes from: the table, or one gameweek's points. Absent for the league. */
  seededBy?: "table" | { gameweek: number };
  /** Invented, and labelled so on screen. */
  placeholder?: boolean;
}

/** Fantrax's own competition: the one it actually scores. */
export const LEAGUE_COMPETITION: Competition = { id: "league", name: "League" };

const PLAYOFFS: Competition = { id: "playoffs", name: "Playoffs", seededBy: "table", placeholder: true };

/** One side of a declared tie: a seed, or the winner or loser of an earlier tie, named by its id. */
export type Seed = number | { winner: string } | { loser: string };

export interface DeclaredTie {
  /** Unique within its competition, and printed for a side not yet decided. */
  id: string;
  home: Seed;
  away: Seed;
}

export interface SeededRound {
  competition: Competition;
  gameweek: number;
  /** "Semi-finals", "Final". */
  name: string;
  ties: readonly DeclaredTie[];
}

/** Every competition, in reading order. The league's own leads because it is the
 *  one being played. */
export const COMPETITIONS: readonly Competition[] = [LEAGUE_COMPETITION, CUP, PLAYOFFS];

/** Every declared knockout round. The playoff final is invented and does NOT
 *  decide the table's cut: Fantrax publishes the real one on `getLeagueInfo`. */
export const KNOCKOUT_ROUNDS: readonly SeededRound[] = [
  ...CUP_ROUNDS,
  {
    competition: PLAYOFFS,
    gameweek: 38,
    name: "Final",
    ties: [{ id: "playoff final", home: 1, away: 2 }],
  },
];

/** What a draw is resolved against. */
export interface Draw {
  /** Seed → team for one competition; a seed nobody holds yet is absent. */
  seeds: (competition: Competition) => ReadonlyMap<number, LeagueTeam>;
  /** A finished gameweek's totals by team id; undefined until it is finished. */
  totals: (gameweek: number) => ReadonlyMap<string, number | null> | undefined;
}

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

/** The declared knockouts falling in one gameweek, drawn as far as the season
 *  has decided them. A side nobody can name yet prints the draw's own words:
 *  "Seed 7", "1st", "Winner QF1". */
export function seededTies(
  rounds: readonly SeededRound[],
  gameweek: number,
  draw: Draw,
): CompetitionTie[] {
  return rounds
    .filter((round) => round.gameweek === gameweek)
    .flatMap((round) =>
      round.ties.map((tie) => ({
        competition: round.competition,
        round: round.name,
        home: drawn(tie.home, round.competition, rounds, draw),
        away: drawn(tie.away, round.competition, rounds, draw),
      })),
    );
}

function drawn(
  seed: Seed,
  competition: Competition,
  rounds: readonly SeededRound[],
  draw: Draw,
): TieSide {
  if (typeof seed === "number") {
    const team = draw.seeds(competition).get(seed);
    if (team) return { team, label: team.name };
    return { team: null, label: typeof competition.seededBy === "object" ? `Seed ${seed}` : ordinal(seed) };
  }
  const [word, id, at] = "winner" in seed ? ["Winner", seed.winner, 0] : ["Loser", seed.loser, 1];
  const team = decided(id, competition, rounds, draw)?.[at];
  return team ? { team, label: team.name } : { team: null, label: `${word} ${id}` };
}

/** A played tie's [winner, loser], or undefined while a side or a total is unknown. */
function decided(
  id: string,
  competition: Competition,
  rounds: readonly SeededRound[],
  draw: Draw,
): [LeagueTeam, LeagueTeam] | undefined {
  const round = rounds.find(
    (entry) => entry.competition.id === competition.id && entry.ties.some((tie) => tie.id === id),
  );
  const tie = round?.ties.find((entry) => entry.id === id);
  const totals = round && draw.totals(round.gameweek);
  if (!tie || !totals) return undefined;

  const home = drawn(tie.home, competition, rounds, draw).team;
  const away = drawn(tie.away, competition, rounds, draw).team;
  const [a, b] = [home && totals.get(home.teamId), away && totals.get(away.teamId)];
  if (!home || !away || a == null || b == null) return undefined;
  if (a !== b) return a > b ? [home, away] : [away, home];

  // Level on points: the higher seed goes through.
  const seedOf = (team: LeagueTeam) =>
    [...draw.seeds(competition)].find(([, entry]) => entry.teamId === team.teamId)?.[0] ?? Infinity;
  return seedOf(home) <= seedOf(away) ? [home, away] : [away, home];
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
