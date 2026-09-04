import TabStrip from "../../../components/shell/TabStrip";
import { MATCH } from "../../club/[code]/match";

// One match's own screens.
//
// **Two, where Championship Manager runs four, and the two missing ones are the
// two we have no data for.** `cm9900/22.jpg` runs `Match Overview · Match Stats
// · Action Zones · Match Report`. FPL publishes no possession, no shots, no
// corners and no zones anywhere — those come from the sister repo's export and
// arrive about a day after full time — so shipping them as plates would be two
// of four dead on all 380 fixtures.
//
// `TabStrip`'s `dim` is not the answer to that: its docblock says it greys a tab
// with nothing behind it FOR THIS SUBJECT, and every use in the app is a
// computed per-club or per-team condition. A plate greyed for every match ever
// played reads as broken rather than as honest. `docs/ui/prem.md` has already
// ruled on this exact case for the club page — *"Tactics is not a tab and will
// not be one… It arrives there when there is a real XI to draw"*. Stats and
// Zones arrive with their data.
//
// **Fantasy Scores, where CM files Player Ratings.** In the game it is a FOOT
// button (`16.jpg`, `21.jpg`) rather than a tab, and it is a tab here because it
// is the view this app exists for — what the afternoon was worth. The foot row
// below the panel is drawn too (`MatchFoot`), and what it carries is what
// `docs/ui/reference/README.md` says that row is for: OTHER screens, plus the
// waiting plate for the advanced data.

const TABS = [
  { segment: "", label: "Overview", key: "overview" },
  // **"Fantasy Scores", not "Players"** (Craig, 4 Sep 2026). The board is not a
  // list of who turned out — the football layer's own screens do that — it is
  // what the afternoon was worth, which is the question this app exists to
  // answer. Two words, so the strip keeps `TabStrip`'s denser label size.
  { segment: "/players", label: "Fantasy Scores", key: "players" },
] as const;

export type MatchTab = (typeof TABS)[number]["key"];

export default function MatchTabs({ id, current }: { id: number; current: MatchTab }) {
  return (
    <TabStrip
      label="Match views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${MATCH}/${id}${tab.segment}` }))}
      current={current}
      labels="word"
    />
  );
}
