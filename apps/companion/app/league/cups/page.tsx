import { CUPS, cupGroups, cupPlan } from "@epl/core";
import LeagueShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import { getSchedule } from "../schedule/schedule";
import { cupHref } from "../SectionNav";
import Bracket from "./Bracket";
import Groups from "./Groups";
import TabStrip from "../../components/shell/TabStrip";

// Each cup's draw; its fixtures are on the schedule. Every side is a placeholder until the draws are made.

export const revalidate = 30;

export default async function CupsPage({
  searchParams,
}: {
  searchParams: Promise<{ cup?: string }>;
}) {
  const asked = await searchParams;
  const cup = CUPS.find((declared) => declared.id === asked.cup) ?? CUPS[0];
  if (cup === undefined) return null;

  const read = await getSchedule();
  if ("unavailable" in read) {
    return (
      <LeagueShell current="cups">
        <FantraxSilent code={read.unavailable}>
          The cups are drawn for the teams in the league, and we cannot read who they are right now.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  const teams = read.info.teams.length;
  const stages = cupPlan(cup, teams);

  return (
    <LeagueShell current="cups" teams={teams}>
      <TabStrip
        label="Cups"
        tabs={CUPS.map((each) => ({ key: each.id, label: each.name, href: cupHref(each.id) }))}
        current={cup.id}
      />

      {stages.length === 0 ? (
        <Nothing title="No draw yet" code={`${teams} teams`}>
          A cup needs two teams, and the league has not got them yet.
        </Nothing>
      ) : (
        <div className="flex flex-col gap-4">
          {cup.seeding.from === "groups" ? (
            <Groups groups={cupGroups(cup, teams)} stage={cup.seeding.stage} />
          ) : null}
          <Bracket
            title={cup.knockout.elimination === "double" ? "Winners' side" : "Knockout"}
            stages={stages.filter((stage) => stage.side === "winners")}
          />
          <Bracket title="Losers' side" stages={stages.filter((stage) => stage.side === "losers")} />
        </div>
      )}
    </LeagueShell>
  );
}
