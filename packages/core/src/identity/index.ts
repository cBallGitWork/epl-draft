// The bridge between the football layer and the league layer, and the only
// sanctioned way the two meet. Nothing downstream name-matches at runtime — it
// reads the generated, human-audited mapping this produces.
//
// Only what actually crosses the package boundary is published. The matcher's
// internals — the normaliser, the similarity metric and its thresholds — stay in
// the layer on purpose: exporting `tokenSetRatio` from `@epl/core` is an
// invitation to name-match at runtime, which is the one thing this layer exists
// to prevent.

export { mergeBridge } from "./bridge";
export type { Bridge, MappedEntry } from "./bridge";
export { matchPlayers } from "./match";
export type { FplCandidate } from "./match";
// The classifier itself stays internal — only `MappedEntry.agreement` leaves the
// layer, and callers read that rather than recompute it.
export type { NameAgreement } from "./similarity";
