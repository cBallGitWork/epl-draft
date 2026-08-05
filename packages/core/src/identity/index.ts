// The bridge between the football layer and the league layer, and the only
// sanctioned way the two meet. Nothing downstream name-matches at runtime — it
// reads the generated, human-audited mapping this produces.

export { toFplClubCode } from "./clubCodes";
export { claimedCodes, isUnmapped, mergeBridge, settledIds } from "./bridge";
export type { Bridge, BridgeEntry, MappedEntry, UnmappedEntry } from "./bridge";
export { matchPlayers } from "./match";
export type { FplCandidate, MatchResult, Proposal } from "./match";
export { fplNameVariants, normalizeName, surname, tokens } from "./normalize";
export { AMBIGUITY_MARGIN, FUZZY_MIN_SCORE, tokenSetRatio } from "./similarity";
