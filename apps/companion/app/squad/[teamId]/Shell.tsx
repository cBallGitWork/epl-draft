import { teamColours } from "@/app/teamColours";
import PlateShell from "../../components/shell/PlateShell";
import { leagueInfo } from "../../round";
import { OWN, teamBack } from "../routes";
import TeamTabs from "./TeamTabs";
import type { TeamTab } from "./TeamTabs";

// The frame of a team's five screens, empty states included: a club's plated bar (`cm9900/25.jpg`), not a
// competition's, in the manager's own colour, and his tabs.

export default async function TeamShell({
  team,
  current,
  empty,
  children,
}: {
  /** Whose screens: the slug builds the tabs, the id finds his colour and full name, the name is the fallback. */
  team: { teamId: string; teamName: string; slug: string };
  current: TeamTab;
  empty?: readonly TeamTab[];
  children: React.ReactNode;
}) {
  // The bar prints Fantrax's name in full; `team.teamName` is the short one every list uses.
  const full = (await leagueInfo())?.teams.find((t) => t.teamId === team.teamId)?.name || team.teamName;
  return (
    <PlateShell colours={teamColours(team.teamId)} title={full}
      back={teamBack(team.slug)}
      phoneBar={team.slug !== OWN}
      tabs={<TeamTabs slug={team.slug} current={current} empty={empty} />}>
      {children}
    </PlateShell>
  );
}
