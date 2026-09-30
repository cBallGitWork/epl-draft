import { CUPS } from "./cups/declared";
import { cupPlan } from "./cups/plan";
import type { PeriodPairing } from "./selectors";
import type { LeagueTeam } from "./types";

// What is on in a gameweek, across every competition the league runs: Fantrax's league, and our cups.

export interface Competition {
  id: string;
  name: string;
}

/** Fantrax's own competition: the one it actually scores. */
export const LEAGUE_COMPETITION: Competition = { id: "league", name: "League" };

/** Every competition, in reading order: the league first because it is the one being played. */
export const COMPETITIONS: readonly Competition[] = [LEAGUE_COMPETITION, ...CUPS];

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
  /** A cup tie's number ("M5"), which later rounds name it by. Null for the league's and a group's. */
  code: string | null;
  home: TieSide;
  away: TieSide;
}

/** Fantrax's pairings, as ties. Both sides are already teams, so nothing is
 *  drawn and nothing can be missing. */
export function leagueTies(pairings: readonly PeriodPairing[]): CompetitionTie[] {
  return pairings.map((pairing) => ({
    competition: LEAGUE_COMPETITION,
    round: null,
    code: null,
    home: { team: pairing.home, label: pairing.home.name },
    away: { team: pairing.away, label: pairing.away.name },
  }));
}

/** The cup ties in one gameweek for a league of `teams`. Nobody is drawn yet, so every side is a
 *  placeholder ("Seed 7", "A1", "Winner M5"). */
export function cupTies(teams: number, gameweek: number): CompetitionTie[] {
  return CUPS.flatMap((cup) =>
    cupPlan(cup, teams)
      .filter((stage) => stage.gameweek === gameweek)
      .flatMap((stage) =>
        stage.fixtures.map((fixture) => ({
          competition: cup,
          round: stage.name,
          code: fixture.code,
          home: { team: null, label: fixture.home },
          away: { team: null, label: fixture.away },
        })),
      ),
  );
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
