import Caption from "../../components/shell/Caption";
import type { CSSProperties } from "react";
import { inkOn, teamColours } from "@epl/core";
import PageHeader from "../../components/shell/PageHeader";
import TeamTabs from "./TeamTabs";
import type { TeamTab } from "./TeamTabs";

// The frame every one of a team's five screens wears.
//
// `league/Shell.tsx`'s argument applies here unchanged: the header and the strip
// are not decoration on an empty state. A reader who lands on Transfers for a
// side that has made none must still be able to reach Fixtures, or the tab is a
// dead end rather than a tab with nothing in it.
//
// **The title bar is the team, and that is why it is not `competition`.** CM has
// two bars and which one you get says what KIND of thing the screen is about:
// `cm9900/24.jpg` is a competition, drawn light with a blue title; `25.jpg` is a
// club, drawn as a filled plate with the name on it. A fantasy team is somebody
// in the competition rather than the competition, so it takes the second — and
// once the colour table lands it is that team's own colour on that plate, which
// is the whole of what `21.jpg` does with a club's identity.

export default function TeamShell({
  team,
  title,
  current,
  sub,
  empty,
  children,
}: {
  /** Whose screens these are. The id builds the tab hrefs and the name goes on
   *  the bar, so both come from the same object rather than being passed
   *  separately and drifting. */
  team: { teamId: string; teamName: string };
  /** What this VIEW is — "Squad", "The Wire". CM's yellow caption inside the
   *  panel: the bar above names the team, this names what is in the box, and
   *  every screen in the reference has both. */
  title: string;
  current: TeamTab;
  sub?: React.ReactNode;
  empty?: readonly TeamTab[];
  children: React.ReactNode;
}) {
  // His own colours on his own bar. `inkOn` is what keeps a pale side readable —
  // it picks dark ink for a light plate, which is `cm9900/16.jpg`'s white Torquay
  // and not a case we invented.
  const colours = teamColours(team.teamId);
  const plate = { background: colours.primary, ink: inkOn(colours) };

  return (
    // `gap-2` for `LeagueShell`'s reason: four boxes down the page, and 12px
    // between each of them stops them reading as one object.
    // **The team's colour, set once for all five tabs.** `--cm-index` re-points
    // the index block every CM table runs down its left — the ranks on Stats,
    // the rounds on Fixtures, the dates on Transfers — so a manager's screens
    // are his rather than the league's deep blue (Craig, 2 Sep). Scoped here
    // rather than passed to each table: it is a property of whose screen this
    // is, and every table inside inherits it without knowing.
    <div
      className="flex flex-col gap-2"
      style={
        {
          "--cm-index": plate.background,
          "--cm-index-ink": plate.ink,
        } as CSSProperties
      }
    >
      <PageHeader title={team.teamName} sub={sub} plate={plate} />
      <TeamTabs teamId={team.teamId} current={current} empty={empty} />

      {/* The caption's own box, not a heading inside the content's (Craig,
          1 Sep). */}
      <Caption>{title}</Caption>

      {children}
    </div>
  );
}
