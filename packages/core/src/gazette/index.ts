// The newspaper's facts. Pure builders, each returning what it can honestly say
// and nothing when it can say nothing — CODE_RULES §5 names gazette section
// builders as a place purity is not negotiable.
//
// The types NESTED inside these — a story's two sides, a column's sections and
// ties, an eleven's lines, the brief's shape, a marked scorecard — are
// deliberately not here. Nothing outside core names them: a caller reaches them
// through the type that holds them, and exporting each one for the day somebody
// might is the speculation §1 forbids. Later can add them.

export { availability } from "./availability";
export { buildBrief } from "./brief";
export { nextDeadline } from "./deadline";
export { deals } from "./deals";
export { editionMatches, normalizePublished } from "./published";
export { stories } from "./stories";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type { EditionKind, PublishedEdition } from "./published";
export type {
  AvailabilityNote,
  Deadline,
  Deal,
  Pick,
  Story,
  StoryResult,
  TeamOfTheWeek,
} from "./types";
