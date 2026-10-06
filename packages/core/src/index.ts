// @epl/core: everything that is not a React component or a Next.js route. football/ (FPL) and league/ (Fantrax)
// never import each other; they meet by argument, at player identity (join/roster.ts) and the calendar.

export * from "./config";
export * from "./time";
export * from "./format";
export * from "./football";
export * from "./identity";
export * from "./join/lineup";
export * from "./join/cleanSheets";
export * from "./join/contribution";
export * from "./join/fullMatchStats";
export * from "./join/involvement";
export * from "./join/leagueProjection";
export * from "./join/leagueProjectionFile";
export { rateMatch } from "./join/rating/rating";
export type { RatedMatch, MatchRating } from "./join/rating/rating";
export { RATING_WEIGHTS } from "./join/rating/weights";
export { marksOf, readRatingStore } from "./join/rating/store";
export type { RatingStore } from "./join/rating/store";
export * from "./fpl-entry";
export * from "./gazette";
export * from "./inbox";
export * from "./news";
export * from "./join/roster";
export * from "./join/squadDetail";
export * from "./join/squadStats";
export * from "./league";
export { politeFetch } from "./http/fetch";
export { ProviderError } from "./http/errors";
