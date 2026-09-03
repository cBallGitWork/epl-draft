// Who the sketches play, and how. COPY, all of it, and Craig's to set.
//
// **Traits are keyed by team id and default to nothing.** A manager with no
// trait is played off his result alone, which is a working sketch — so the
// table can stay empty until Craig fills it, and a new manager joining the
// league never breaks the column.
//
// The two studio names are homage and deliberately not the real ones: the
// sketch is of a KIND of television, not of two people who could object to it.

/** The press room's cast: teamId → a couple of words on how he talks.
 *  Craig's, and empty until he says otherwise. */
export const MANAGER_TRAITS: Record<string, string> = {};

/** The studio pair. Two names, and the register lives in the voice file. */
export const STUDIO_ANCHOR = "The anchor";
export const STUDIO_ANALYST = "The analyst";

