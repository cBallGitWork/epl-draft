// The newspaper's facts. Pure builders, each returning what it can honestly say
// and nothing when it can say nothing — CODE_RULES §5 names gazette section
// builders as a place purity is not negotiable.

export { availability } from "./availability";
export { firstKickoff, locksAt, nextDeadline } from "./deadline";
export { deals } from "./deals";
export { teamOfTheWeek } from "./teamOfTheWeek";
export type { AvailabilityNote, Deadline, Deal, Pick, TeamOfTheWeek } from "./types";
