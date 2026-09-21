import TabStrip from "../../components/shell/TabStrip";
import { SQUAD } from "../routes";

// One team's own screens, and how you get between them.
//
// **Championship Manager's club screen, which is five tabs and not one page.**
// `cm9900/25.jpg` runs `Squad · Transfers · Next Match · Fixtures · Finances &
// Info` across the top of Everton, and `cm0102/07.jpg` runs the identical set
// two releases later with `General Info` in the last slot — so this is the
// reference's own spine rather than a shape invented for us. Ours drops the
// finances, which a fantasy team does not have, and spends the slot on Stats.
//
// A server component for `SectionNav`'s reason: each page here knows which one
// it is, so passing that in costs a prop and saves shipping a component to the
// phone to work out what the URL already says. The plates are `shell/TabStrip`,
// which both strips share.
//
// **The League strip is not replaced, because it was never here.** `/squad` and
// `/squad/[teamId]` render no `SectionNav` at all — the rail is the only thing
// that marks where these screens sit.
//
// **It marks only the reader's own, and that is why the hrefs follow the SLUG.**
// This note used to say `owns()` prefix-matched `/squad/` so every tab lit
// Squads in the rail; Squads stopped being a section on 2 Sep 2026 and nothing
// lit at all, and My Team took its place on 21 Sep owning exactly `/squad/me` —
// a prefix would light a plate reading My Team over a rival's squad. So a
// manager who came in through the front door stays inside `/squad/me/*` as he
// crosses these five, and the plate stays lit.

/** The five, declared once.
 *
 *  `segment` rather than a stored `href`, because every one of these is a route
 *  under a team that is only known at render. `key` is what a page passes back
 *  to say which it is, on `SectionNav`'s pattern — a string the type system
 *  checks rather than a pathname compared at runtime. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  { segment: "/transfers", label: "Transfers", key: "transfers" },
  // "Match", not "Next Match". Two words wrap to two lines at 390 while the
  // other four sit on one, and a strip whose plates disagree about their height
  // is not a strip. CM's own tabs are one word wherever it can manage it
  // (`Squad`, `Transfers`, `Fixtures`) and the screen it heads says "Next Match"
  // in the caption box under the strip, where there is room for it.
  { segment: "/next", label: "Match", key: "next" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type TeamTab = (typeof TABS)[number]["key"];

export default function TeamTabs({
  slug,
  current,
  /** Tabs with nothing behind them for THIS team — a side that has made no
   *  transactions, a period with no pairing. Named by key rather than counted
   *  here, because whether a tab is empty is a question about data and this
   *  file has none. `TabStrip` greys them and keeps them in place. */
  empty = [],
}: {
  /** What the URL calls this team — his id, or `me` on the reader's own front
   *  door. `team.ts` explains why the strip follows the URL's word rather than
   *  the id it resolved to. */
  slug: string;
  current: TeamTab;
  empty?: readonly TeamTab[];
}) {
  // `word` and not `phrase`: every label here is one word, and the strip is set
  // to keep all five on one line.
  return (
    <TabStrip
      label="Team views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${SQUAD}/${slug}${tab.segment}` }))}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
