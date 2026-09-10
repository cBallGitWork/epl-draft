import TabStrip from "../components/shell/TabStrip";
import { ANALYSIS, POOL } from "./query";

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

const VIEWS = [
  { href: POOL, label: "Board", key: "pool" },
  { href: ANALYSIS, label: "Analysis", key: "analysis" },
] as const;

export type ScoutView = (typeof VIEWS)[number]["key"];

export default function PoolNav({ current }: { current: ScoutView }) {
  return <TabStrip label="Scout views" tabs={VIEWS} current={current} />;
}
