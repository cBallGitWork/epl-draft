import { type Club, crestUrl, DASH, ordinal } from "@epl/core";

/** One club as a `ScoreRow` half: its names, its crest and its place in the real table. */
export function scoreSide(club: Club | undefined, places: ReadonlyMap<number, number>) {
  if (club === undefined) return { name: DASH };
  const place = places.get(club.id);
  return { name: club.name, short: club.shortName, crest: crestUrl(club), place: place === undefined ? null : ordinal(place) };
}
