import TabStrip from "../../../components/shell/TabStrip";
import { CLUB } from "../../routes";

// One club's own screens, and how you get between them.
//
// **Championship Manager's club screen, which is a strip and not a page.**
// `cm9900/25.jpg` runs `Squad · Transfers · Next Match · Fixtures · Finances &
// Info` across the top of Everton. Ours drops two: Transfers, because FPL
// publishes no transfer feed for a real club and inventing one is the failure
// this section is careful about, and Finances, which `squad/[teamId]/TeamTabs`
// already dropped for a fantasy side.
//
// **Tactics is not here, and that is the reference's own filing.** `25.jpg` has
// no Tactics tab: `Tactics · Training · Last Match · 6th in PRM · History` is
// the FOOT row under the panel. So it arrives downstairs when there is a real
// XI to draw, and `PremNav` already records why a foot row waits for its second
// entry rather than shipping as one stray button.
//
// A server component for `SectionNav`'s reason: each page knows which one it
// is, so passing that in costs a prop and saves shipping a component to the
// phone to work out what the URL already says.

/** `segment` rather than a stored href, because every one of these is a route
 *  under a club that is only known at render — `TeamTabs` does the same for the
 *  same reason. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  // **Set Pieces, where Match used to be** (Craig, 3 Sep 2026: "we can replace
  // match (fixtures have it) with set piece takers"). The Match tab was a
  // duplicate — the fixture run opens on the next game and says who, when and
  // where — and a set-piece order is the one thing on this club that a reader
  // cannot get anywhere else. One word each, so the strip's plates still agree
  // about their height.
  // **"Set Pieces" in full** (Craig, 5 Sep 2026: "title on button needs to be
  // set pieces). It was abbreviated to fit a four-plate strip at 390; the strip
  // wraps its labels to two lines (`TabStrip`'s `labels="word"`), so the room
  // was there and "Pieces" was a word that means nothing on its own.
  { segment: "/set-pieces", label: "Set Pieces", key: "setPieces" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type ClubTab = (typeof TABS)[number]["key"];

export default function ClubTabs({
  code,
  current,
  /** Tabs with nothing behind them for THIS club. `TabStrip` greys them and
   *  keeps them in place, which is CM's own answer for a view that exists and
   *  has nothing in it (`cm0102/07.jpg`). */
  empty = [],
}: {
  code: number;
  current: ClubTab;
  empty?: readonly ClubTab[];
}) {
  return (
    <TabStrip
      label="Club views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${CLUB}/${code}${tab.segment}` }))}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
