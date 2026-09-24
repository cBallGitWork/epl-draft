import { PLANNER_RUN, londonDayAndDate, plannerGameweeks, plannerRows, strengthTable, type PlannerView } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import TabStrip from "../../components/shell/TabStrip";
import PlannerBoard from "./PlannerBoard";
import StrengthRanks from "./StrengthRanks";
import { footballNow, seasonFixtures } from "../../football";
import { intelStrength, intelStrengthManifest } from "../../intel";
import { PLANNER } from "../routes";
import { BOARD_KEY, SECTION_BAR, phoneShows } from "@/app/desk";

// The fixture planner: whose next six are kind, for a club's attackers (their opponents' defences) and for its
// defenders (their opponents' attacks). Craig, 24 Sep 2026. The desk shows both views; a phone picks one.

export const revalidate = 30;

const VIEWS: readonly { key: PlannerView; label: string; board: string; ranks: string }[] = [
  { key: "attack", label: "Attack", board: "Attack · their defence", ranks: "Defences, weakest first" },
  { key: "defence", label: "Defence", board: "Defence · their attack", ranks: "Attacks, weakest first" },
];

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = (await searchParams).view;
  const view: PlannerView = asked === "defence" ? "defence" : "attack";
  const [fixtures, snapshot] = await Promise.all([seasonFixtures(), footballNow()]);
  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN);

  if (intelStrength.size === 0 || gameweeks.length === 0) {
    return (
      <ScoutShell current="planner" title="Fixture planner" rows={0}>
        <Nothing title={gameweeks.length === 0 ? "No fixtures left" : "No strength ratings yet"}>
          {gameweeks.length === 0
            ? "The season has no matches left to plan for."
            : "The planner ranks opponents by the sister model's team strength, and no export has landed."}
        </Nothing>
      </ScoutShell>
    );
  }

  const clubs = new Map(snapshot.clubs.map((club) => [club.code, club]));
  const exported = londonDayAndDate(intelStrengthManifest.exportedAt);

  return (
    <ScoutShell current="planner" title={`Gameweeks ${gameweeks[0]}–${gameweeks[gameweeks.length - 1]}`} rows={0}>
      <div className="lg:hidden">
        <TabStrip
          label="Planner views"
          tabs={VIEWS.map((entry) => ({ key: entry.key, label: entry.label, href: `${PLANNER}?view=${entry.key}` }))}
          current={view}
        />
      </div>

      {/* Provenance at the point of use: the ranks are ours, not FPL's difficulty (DESIGN §7). */}
      <p className={BOARD_KEY}>
        <span className="lg:hidden">Home in capitals, away in lower case · </span>
        Each figure ranks the opponent 1 (weakest) to 20 · <span className="text-info">ours</span>: Dixon-Coles
        team strength, exported {exported}
      </p>

      <div className="grid gap-2 lg:grid-cols-2">
        {VIEWS.map((entry) => (
          <section key={entry.key} className={`flex min-w-0 flex-col gap-2 ${phoneShows(view === entry.key)}`}>
            <p className={`${SECTION_BAR} max-lg:hidden`}>{entry.board}</p>
            <PlannerBoard
              view={entry.key}
              rows={plannerRows(fixtures, snapshot.clubs, intelStrength, entry.key, gameweeks)}
              gameweeks={gameweeks}
            />
            <p className={SECTION_BAR}>{entry.ranks}</p>
            <StrengthRanks table={strengthTable(intelStrength, entry.key)} clubs={clubs} />
          </section>
        ))}
      </div>
    </ScoutShell>
  );
}
