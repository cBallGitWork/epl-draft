import TabStrip from "../components/shell/TabStrip";
import { PREM, PREM_RESULTS } from "./routes";

// The Premiership section's own views.
// A server component: each page names its view, so the strip ships no script to work it out.

const TABS = [
  { href: PREM, label: "Table", key: "table" },
  // Results before Fixtures: the commoner reader arrives on a Monday, wanting what happened.
  { href: PREM_RESULTS, label: "Results", key: "results" },
  { href: `${PREM}/fixtures`, label: "Fixtures", key: "fixtures" },
  { href: `${PREM}/team-stats`, label: "Team Stats", key: "teamStats" },
  { href: `${PREM}/data`, label: "Data", key: "data" },
] as const;

/** Which tab a page IS. */
export type PremSection = (typeof TABS)[number]["key"];

/** A tab's route by key, never position; a missing key throws, so the build stops. */
function at(key: (typeof TABS)[number]["key"]): string {
  const found = TABS.find((tab) => tab.key === key);
  if (found === undefined) throw new Error(`no prem tab keyed ${key}`);
  return found.href;
}

/** The section's front door: the table with no query on it. */
export const TABLE = at("table");

/** The team stats board's route. */
export const TEAM_STATS = at("teamStats");

/** The leaders' lists, which the list picker and each list's Top 50 plate spell. */
export const DATA = at("data");

export default function PremNav({ current }: { current: PremSection }) {
  // `word`, not `phrase`: at 390 a 74px plate would wrap "Team Stats" alone and leave the strip uneven.
  return <TabStrip label="Premiership views" tabs={TABS} current={current} labels="word" />;
}
