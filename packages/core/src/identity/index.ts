// The bridge between the football layer and the league layer, and the only
// sanctioned way the two meet. Nothing downstream name-matches at runtime — it
// reads the generated, human-audited mapping this produces.
//
// Only what actually crosses the package boundary is published. The matcher's
// internals — the normaliser, the similarity metric and its thresholds — stay in
// the layer on purpose: exporting `tokenSetRatio` from `@epl/core` is an
// invitation to name-match at runtime, which is the one thing this layer exists
// to prevent.

export { isUnmapped, mergeBridge } from "./bridge";
// The guard travels with the type: a caller holding a `BridgeEntry` has to be
// able to ask whether it settled on anybody, and writing that check a second
// time at the app edge would be the same test in two places disagreeing later.
export type { Bridge, BridgeEntry, MappedEntry } from "./bridge";
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
