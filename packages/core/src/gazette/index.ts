// The newspaper's facts. Pure builders, each returning what it can honestly say
// and nothing when it can say nothing — CODE_RULES §5 names gazette section
// builders as a place purity is not negotiable.

export { availability } from "./availability";
export { buildBrief } from "./brief";
export type { Brief } from "./brief";
export { nextDeadline } from "./deadline";
export { deals } from "./deals";
export { editionMatches, markPreview, normalizePublished } from "./published";
export { stories } from "./stories";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type {
  EditionKind,
  EditionSection,
  EditionTie,
  Marked,
  PublishedEdition,
} from "./published";
export type {
  AvailabilityNote,
  Deadline,
  Deal,
  Pick,
  Story,
  StoryResult,
  StorySide,
  TeamOfTheWeek,
} from "./types";
