import TabStrip from "../components/shell/TabStrip";
import { ANALYSIS, POOL } from "./routes";

// Scout's own views.
//
// **It arrives with the second one, not before.** `ScoutShell` shipped with no
// strip on 6 Sep 2026 and said why: the section had one view, and
// `league/SectionNav` already records Craig's ruling that one entry is a stray
// button under a panel rather than a bar. Compare is the second, so the strip is
// earned rather than guessed at — which is the same bar CODE_RULES §1 sets for
// an abstraction and the same one this app keeps setting for a row of plates.
//
// A server component like every other strip: each page knows which view it is
// and passes it in, which costs a prop and saves shipping a component to the
// phone to work it out from the URL.
//
// **"Overview", not "Board"** (Craig, 10 Sep 2026: *"replace with something more
// CM"*). Overview is the game's own first-tab word — `cm9900/12.jpg` opens its
// strip with it and `16.jpg` runs `Match Overview · Match Stats · Action Zones ·
// Match Report` — and it is what this view is: the whole pool at a glance,
// against Analysis, which is one man or two looked at closely. "Board" was ours
// and named the furniture rather than the reading.
//
// The KEY stays `pool`, because it is the URL's business and a route that is
// renamed every time a label is costs a redirect nobody asked for.

const VIEWS = [
  { href: POOL, label: "Overview", key: "pool" },
  { href: ANALYSIS, label: "Analysis", key: "analysis" },
] as const;

export type ScoutView = (typeof VIEWS)[number]["key"];

export default function PoolNav({ current }: { current: ScoutView }) {
  return <TabStrip label="Scout views" tabs={VIEWS} current={current} />;
}
