// The bridge between the two layers. Nothing downstream name-matches at runtime: it reads the audited mapping.
// The similarity metric and its thresholds stay inside, since exporting them invites runtime name-matching.

// `isAssumed` travels with the bridge, so no caller re-derives which rows a person stands behind.
export { fplCodeOf, isAssumed, isUnmapped, mergeBridge } from "./bridge";
export type { Bridge, MappedEntry } from "./bridge";
// Fantrax and FPL disagree on two club codes, so a club asset keyed off a Fantrax code translates first.
export { toFantraxClubCode, toFplClubCode } from "./clubCodes";
// The normaliser, for a script that matches names once into a checked-in file and must fold them as the bridge does.
export { normalizeName } from "./normalize";
export { matchPlayers } from "./match";
export type { FplCandidate } from "./match";
// The residue split travels with the matcher, to sort its proposals into assumed and for review.
export { assumeUnmapped } from "./unmapped";
export type { UnmappedSplit } from "./unmapped";
