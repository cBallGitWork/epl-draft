import TabStrip from "../components/shell/TabStrip";
import { ANALYSIS, PLANNER, POOL, TEAMS } from "./routes";

// The Data section's own views (Craig, 24 Sep 2026: Players and Compare, with more to come), each page passing
// its own. The keys are the URL's business and outlive the labels: `analysis` is Compare's route.

const VIEWS = [
  { href: POOL, label: "Players", key: "pool" },
  { href: ANALYSIS, label: "Compare", key: "analysis" },
  { href: TEAMS, label: "Teams", key: "teams" },
  { href: PLANNER, label: "Planner", key: "planner" },
] as const;

export type ScoutView = (typeof VIEWS)[number]["key"];

export default function PoolNav({ current }: { current: ScoutView }) {
  return <TabStrip label="Data views" tabs={VIEWS} current={current} />;
}
