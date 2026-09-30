// The bridge between the football layer and the league layer, and the only
// sanctioned way the two meet. Nothing downstream name-matches at runtime — it
// reads the generated, human-audited mapping this produces.
//
// Only what actually crosses the package boundary is published. The matcher's
// internals — the normaliser, the similarity metric and its thresholds — stay in
// the layer on purpose: exporting `tokenSetRatio` from `@epl/core` is an
// invitation to name-match at runtime, which is the one thing this layer exists
// to prevent.

// `isAssumed` travels with the two beside it for the same reason they do: the
// difference between a row the script guessed and a row a person stands behind
// is the whole design of this file, and a caller that has to re-derive it from
// `unmappedBy` and `auditedAt` is a caller that will one day get it wrong and
// silently reopen somebody's verdict.
export { fplCodeOf, isAssumed, isUnmapped, mergeBridge } from "./bridge";
// The guard travels with the type: a caller holding a `BridgeEntry` has to be
// able to ask whether it settled on anybody, and writing that check a second
// time at the app edge would be the same test in two places disagreeing later.
export type { Bridge, BridgeEntry, MappedEntry } from "./bridge";
// The one piece of the matcher's world that a rendering caller legitimately
// needs: Fantrax and FPL disagree on two club codes out of twenty, so anything
// keying a club asset or a palette off a Fantrax code has to translate first or
// silently mis-colour every Brentford and Forest player. A lookup of two, not a
// name-matcher — the boundary this barrel guards stays where it was.
export { toFantraxClubCode, toFplClubCode } from "./clubCodes";
// The normaliser alone, and deliberately not the matcher's internals. A SCRIPT
// that matches names once and writes a checked-in data file is what CODE_RULES
// §3 allows, and it should fold "Groß" and "Ødegaard" the way the bridge does
// rather than hand-roll a third spelling of the same idea.
export { normalizeName } from "./normalize";
export { matchPlayers } from "./match";
export type { FplCandidate } from "./match";
// The residue split travels with the matcher: a caller that runs `matchPlayers`
// has proposals in hand and no other way to tell the ones it can answer from the
// ones it cannot.
export { assumeUnmapped } from "./unmapped";
export type { UnmappedSplit } from "./unmapped";
// The classifier itself stays internal — only `MappedEntry.agreement` leaves the
// layer, and callers read that rather than recompute it.
export type { NameAgreement } from "./similarity";
