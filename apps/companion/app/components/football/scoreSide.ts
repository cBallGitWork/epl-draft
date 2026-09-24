import { type Club, crestUrl, DASH } from "@epl/core";

/** One club as a `ScoreRow` half: its names, its crest and its place in the real table. */
export function scoreSide(club: Club | undefined, places: ReadonlyMap<number, number>) {
  return club === undefined
    ? { name: DASH }
    : {
        name: club.name,
        short: club.shortName,
        badge: crestUrl(club),
        place: places.get(club.id) ?? null,
      };
}
