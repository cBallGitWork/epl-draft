import type { StrengthPlaces } from "../../football/intel/strength";
import { byKickoff } from "../../football/selectors";
import type { Club, Fixture } from "../../football/types";
import { londonDayOf } from "../../time";
import { fullClubName } from "../clubNames";
import { standing } from "../predictions/squad";

// A club's next three matches after the report's day, the opponent in words only when it sits at an end of the ratings.

export interface NextMatch {
  opponent: string;
  home: boolean;
  /** "a dangerous attack", "a soft defence"…; empty when the opponent is ordinary at both. */
  words: string[];
}

const COUNT = 3;

export function nextThree(
  season: readonly Fixture[],
  clubs: readonly Club[],
  clubCode: number,
  day: string,
  table: StrengthPlaces,
): NextMatch[] {
  const club = clubs.find((c) => c.code === clubCode);
  if (club === undefined) return [];
  const byId = new Map(clubs.map((c) => [c.id, c]));
  return season
    .filter((f) => (f.homeClubId === club.id || f.awayClubId === club.id) && f.kickoff !== null && (londonDayOf(f.kickoff) ?? "") > day)
    .sort(byKickoff)
    .slice(0, COUNT)
    .flatMap((f) => {
      const home = f.homeClubId === club.id;
      const opponent = byId.get(home ? f.awayClubId : f.homeClubId);
      if (opponent === undefined) return [];
      const words = [standing(opponent.code, "attack", table), standing(opponent.code, "defence", table)].filter((w): w is string => w !== null);
      return [{ opponent: fullClubName(opponent.name), home, words }];
    });
}
