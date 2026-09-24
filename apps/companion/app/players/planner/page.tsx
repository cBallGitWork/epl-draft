import { PLANNER_RUN, plannerGameweeks, plannerRows, strengthTable, type PlannerView } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import TabStrip from "../../components/shell/TabStrip";
import PlannerBoard from "./PlannerBoard";
import StrengthRanks from "./StrengthRanks";
import { footballNow, seasonFixtures } from "../../football";
import { intelStrength } from "../../intel";
import { PLANNER } from "../routes";
import { SECTION_BAR } from "@/app/desk";

// The fixture planner: whose next six are kind for a club's attackers (their opponents' defences) and for its
// defenders (their opponents' attacks), and the rankings behind both. One view at a time (Craig, 24 Sep 2026).

export const revalidate = 30;

type View = PlannerView | "rankings";

const VIEWS: readonly { key: View; label: string }[] = [
  { key: "attack", label: "Attack" },
  { key: "defence", label: "Defence" },
  { key: "rankings", label: "Rankings" },
];

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = (await searchParams).view;
  const view: View = VIEWS.find((entry) => entry.key === asked)?.key ?? "attack";
  const [fixtures, snapshot] = await Promise.all([seasonFixtures(), footballNow()]);
  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN);

  if (intelStrength.size === 0 || gameweeks.length === 0) {
    return (
      <ScoutShell current="planner">
        <Nothing title={gameweeks.length === 0 ? "No fixtures left" : "No strength ratings yet"}>
          {gameweeks.length === 0
            ? "The season has no matches left to plan for."
            : "The planner ranks opponents by the sister model's team strength, and no export has landed."}
        </Nothing>
      </ScoutShell>
    );
  }

  const clubs = new Map(snapshot.clubs.map((club) => [club.code, club]));

  return (
    <ScoutShell current="planner">
      <TabStrip
        label="Planner views"
        tabs={VIEWS.map((entry) => ({ ...entry, href: `${PLANNER}?view=${entry.key}` }))}
        current={view}
        labels="word"
      />
      {view === "rankings" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {(["attack", "defence"] as const).map((measure) => (
            <section key={measure} className="flex min-w-0 flex-col gap-2">
              <p className={SECTION_BAR}>{measure === "attack" ? "Attack" : "Defence"}, best first</p>
              <StrengthRanks table={strengthTable(intelStrength, measure)} clubs={clubs} />
            </section>
          ))}
        </div>
      ) : (
        <PlannerBoard
          view={view}
          rows={plannerRows(fixtures, snapshot.clubs, intelStrength, view, gameweeks)}
          gameweeks={gameweeks}
        />
      )}
    </ScoutShell>
  );
}
