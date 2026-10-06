import { teamColours } from "@epl/core";
import PlateShell from "../../components/shell/PlateShell";
import { leagueInfo } from "../../round";
import { teamBack } from "../routes";
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
// in the competition rather than the competition, so it takes the second, in
// that manager's own colour.
//
// The bar and the `--cm-index` re-point are `PlateShell`'s now —
// extracted at the third plated subject, exactly where `prem/club/[code]/Shell`
// predicted. What is left here is what is this subject's own: which colour table
// he is looked up in, and which tabs he has.

export default async function TeamShell({
  team,
  current,
  sub,
  empty,
  children,
}: {
  /** Whose screens these are. The slug builds the tab hrefs, the id looks his
   *  colour and full name up and the name is the bar's fallback, so all three come from the same
   *  object rather than being passed separately and drifting. */
  team: { teamId: string; teamName: string; slug: string };
  current: TeamTab;
  sub?: React.ReactNode;
  empty?: readonly TeamTab[];
  children: React.ReactNode;
}) {
  // A manager's colour comes from `teamColours` and a club's from
  // `clubColours`. That difference is the reason `PlateShell` takes the colours
  // resolved rather than an id.
  // The bar prints Fantrax's name in full; `team.teamName` is the short one every list uses.
  const full = (await leagueInfo())?.teams.find((t) => t.teamId === team.teamId)?.name || team.teamName;
  return (
    <PlateShell colours={teamColours(team.teamId)} title={full} sub={sub}
      back={teamBack(team.slug)}
      tabs={<TeamTabs slug={team.slug} current={current} empty={empty} />}>
      {children}
    </PlateShell>
  );
}
