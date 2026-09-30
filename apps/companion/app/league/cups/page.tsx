import Link from "next/link";
import { CUPS, cupGroups, cupPlan, cupTies, type Cup } from "@epl/core";
import LeagueShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import Round, { EMPTY } from "../schedule/Round";
import { getSchedule } from "../schedule/schedule";
import { cupHref } from "../SectionNav";
import Bracket from "./Bracket";
import Groups from "./Groups";
import { TAB } from "@/app/desk";

// Each cup's whole draw, as the schedule's fixture list or as a bracket. Nobody is drawn yet, so
// every side is a placeholder: "Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5".

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

const VIEWS = [
  { key: "fixtures", label: "Fixtures" },
  { key: "bracket", label: "Bracket" },
] as const;

const NO_NAMES: Map<string, string> = new Map();
const NO_PLACES: Map<string, number> = new Map();

export default async function CupsPage({
  searchParams,
}: {
  searchParams: Promise<{ cup?: string; view?: string }>;
}) {
  const asked = await searchParams;
  const cup = CUPS.find((declared) => declared.id === asked.cup) ?? CUPS[0];
  if (cup === undefined) return null;
  const view = asked.view === "bracket" ? "bracket" : "fixtures";

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
      <Picker
        label="Cups"
        options={CUPS.map((each) => ({ key: each.id, label: each.name, href: cupHref(each.id, asked.view) }))}
        current={cup.id}
      />
      <Picker
        label="Cup views"
        options={VIEWS.map((each) => ({ key: each.key, label: each.label, href: cupHref(cup.id, each.key) }))}
        current={view}
      />

      {stages.length === 0 ? (
        <Nothing title="No draw yet" code={`${teams} teams`}>
          A cup needs two teams, and the league has not got them yet.
        </Nothing>
      ) : (
        <>
          <p className="px-3 text-2xs text-faint">{format(cup)}</p>
          {view === "bracket" ? (
            <div className="flex flex-col gap-4">
              <Groups groups={cupGroups(cup, teams)} />
              <Bracket
                title={cup.knockout.elimination === "double" ? "Winners' side" : "Knockout"}
                stages={stages.filter((stage) => stage.side === "winners")}
              />
              <Bracket title="Losers' side" stages={stages.filter((stage) => stage.side === "losers")} />
            </div>
          ) : (
            <div className="cm-scroll cm-scroll-y flex flex-col gap-8 lg:max-h-[42rem] lg:overflow-y-auto">
              {read.rounds.map((round) => (
                <Round
                  key={round.period}
                  round={round}
                  ties={cupTies(teams, round.gameweek).filter((tie) => tie.competition.id === cup.id)}
                  points={EMPTY}
                  badges={NO_NAMES}
                  places={NO_PLACES}
                  mine={null}
                />
              ))}
            </div>
          )}
        </>
      )}
    </LeagueShell>
  );
}

function Picker({
  label,
  options,
  current,
}: {
  label: string;
  options: readonly { key: string; label: string; href: string }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap">
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={option.key === current ? "page" : undefined}
          className={`${TAB} min-h-11 px-2 text-2xs lg:min-h-9`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

/** One line on how the cup is played, in the words Craig set it in. */
function format(cup: Cup): string {
  const knockout =
    cup.knockout.elimination === "double" ? "Double elimination, no reset final" : "Knockout";
  if (cup.seeding.from === "groups") {
    const { groups, qualify, drawGameweek } = cup.seeding.stage;
    return `Placeholder draw. ${groups} groups drawn around GW${drawGameweek}, top ${qualify} through, group winners skip the first knockout round. ${knockout}, one leg.`;
  }
  const drawn = cup.knockout.drawnRounds ?? 0;
  const rounds = drawn === 1 ? "Round 1" : drawn === 2 ? "Rounds 1 and 2" : `Rounds 1 to ${drawn}`;
  const draw = drawn > 0 ? ` ${rounds} drawn at random, then a fixed bracket.` : "";
  return `Placeholder draw. Seeded on GW${cup.seeding.gameweek} points, a tie going to the higher league place.${draw} ${knockout}, one leg.`;
}
