import TabStrip from "../../../components/shell/TabStrip";
import { MATCH } from "../../routes";

// One match's own screens.
//
// **Five, where Championship Manager runs four.** `cm9900/22.jpg` runs
// `Match Overview · Match Stats · Action Zones · Match Report`, and we now carry
// four of those four less Action Zones, plus Fantasy Scores — the view this app
// exists for.
//
// *This docblock said for a week that we shipped TWO tabs "and the two missing
// ones are the two we have no data for". Both halves went stale: the strip had
// grown to four, and Match Stats had a source the whole time —
// `fetchPlMatchStats` was written on 4 Sep and had no caller in the app until
// 10 Sep. `cm9900/22.jpg`'s board is thirteen of thirteen rows from that one
// call. Corrected rather than patched, because the reasoning was the stale part
// and not the count.*
//
// **Action Zones stays off, and now it is the only one.** Nothing in any
// provider publishes a zone. `TabStrip`'s `dim` is not the answer: its docblock
// says it greys a tab with nothing behind it FOR THIS SUBJECT, and a plate greyed
// for every match ever played reads as broken rather than honest.
// `docs/ui/prem.md` ruled on this exact case — *"Tactics is not a tab and will
// not be one… It arrives there when there is a real XI to draw"*. Zones arrive
// with their data.
//
// **Fantasy Scores, where CM files Player Ratings.** In the game it is a FOOT
// button (`16.jpg`, `21.jpg`) rather than a tab, and it is a tab here because it
// is the view this app exists for — what the afternoon was worth.

const TABS = [
  { segment: "", label: "Overview", key: "overview" },
  // **Player Stats came off the Overview and became a tab** (Craig, 5 Sep 2026:
  // "player stats can be its own blue bar at the top of the match page, remove
  // from overview"). It was the second half of that screen, under the scoresheet
  // and the facts line, which made the Overview two screens and buried what CM's
  // own Overview is: a dated head, who scored and when, and a foot line.
  // `cm0102/02.jpg` carries no table at all and has a FOOT ROW of five buttons
  // for everything that is one.
  { segment: "/stats", label: "Player Stats", key: "stats" },
  // **The two SIDES against each other**, where Player Stats is every man in the
  // match — which is what tells `/team-stats` from `/stats`. Thirteen rows of
  // Opta's own metrics, and the tab CM has had since 1999.
  { segment: "/team-stats", label: "Match Stats", key: "team-stats" },
  // **"Line Ups"** (Craig, 11 Sep 2026: *"change title to line ups"*). It was
  // "Fantasy Scores" from 4 Sep, on the argument that the board is not a list of
  // who turned out but what the afternoon was worth. Both halves are on the
  // screen and the tab can only name one, and what a reader opens it FOR is the
  // two elevens — the score is what he finds when he gets there. Still two
  // words, so the strip keeps `TabStrip`'s denser label size.
  { segment: "/players", label: "Line Ups", key: "players" },
  // **The Premier League's own minute-by-minute** (Craig, 5 Sep 2026: "needs a
  // match report section that we take from the premier league site"). CM's own
  // fourth tab on this screen is `Match Report` (`cm0102/02.jpg`), which is the
  // absence DESIGN §2 has carried by name since the reference was catalogued —
  // "a text-commentary matchday". The mapper has been written and tested since
  // 4 Sep and drew nothing.
  { segment: "/report", label: "Match Report", key: "report" },
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
