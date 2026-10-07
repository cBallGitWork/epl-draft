import TabStrip from "../components/shell/TabStrip";
import { LEAGUE } from "./routes";

// The League tab's own views; a server component, since each page knows which one it is.

/** The blue buttons, in Craig's order (27 Sep 2026: *"Change table to league. Move cups to 2nd"*); Scoring last (6 Oct).
 *  Matchups is a route here but not a tab; Player Stats left for its own section on 6 Sep. */
const SECTIONS = [
  { href: LEAGUE, label: "League", key: "table" },
  { href: `${LEAGUE}/cups`, label: "Cups", key: "cups" },
  { href: `${LEAGUE}/schedule`, label: "Schedule", key: "schedule" },
  { href: `${LEAGUE}/results`, label: "Results", key: "results" },
  { href: `${LEAGUE}/team-stats`, label: "Team Stats", key: "teamStats" },
  { href: `${LEAGUE}/scoring`, label: "Scoring", key: "scoring" },
] as const;

/** A section's route, found by key and never by index: an insert would repoint an index silently. */
function at(key: (typeof SECTIONS)[number]["key"]): string {
  const found = SECTIONS.find((section) => section.key === key);
  if (found === undefined) throw new Error(`no league section keyed ${key}`);
  return found.href;
}

export const TEAM_STATS = at("teamStats");
const CUPS_PAGE = at("cups");

/** One cup's page. */
export function cupHref(cupId: string): string {
  return `${CUPS_PAGE}?${new URLSearchParams({ cup: cupId })}`;
}

/** The tabs, plus Matchups: a section a route can be on without a plate in the strip. */
export type LeagueSection = (typeof SECTIONS)[number]["key"] | "matchups";

export default function SectionNav({ current }: { current: LeagueSection }) {
  // On Matchups no plate is current.
  const here = SECTIONS.find((section) => section.key === current)?.key ?? null;
  // `word` labels: at 11px "Team Stats" ran its plate 34px past a 390 viewport.
  return <TabStrip label="League views" tabs={SECTIONS} current={here} labels="word" />;
}
