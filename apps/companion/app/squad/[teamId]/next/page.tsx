import TabEmpty from "../../../components/league/TabEmpty";
import { headToHeads, inkOn } from "@epl/core";
import TeamShell from "../Shell";
import { SQUAD } from "../../routes";
import { identify, whoseTeam } from "../team";
import { getLeagueSquads, readableOr404 } from "../../../squads";
import { planningRound } from "../../../round";
import { leagueTable } from "../../../standings";
import Link from "@/app/components/shell/Link";
import { LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";
import { teamHref } from "@/app/squad/routes";
import { shortName } from "../../../teamNames";
import { teamColours } from "@/app/teamColours";
import { placings } from "../../../league/placings";

// Who he plays: both sides on their own colours, as CM sets a match header (`cm9900/21.jpg`); the pairing is already
// in the squads payload.

export const revalidate = 30;

export default async function NextMatchPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  // The whole read, not `leagueTeams`: this screen needs the matchups and the period too.
  const [read, table] = await Promise.all([
    getLeagueSquads(await planningRound()),
    leagueTable(),
  ]);
  const squads = readableOr404(read, SQUAD);

  const { team } = await whoseTeam(slug, squads.period.teams);
  const teamId = team.teamId;

  // Two in a double header, one under the other.
  const ties =
    squads.info !== null && squads.roundPeriod !== null
      ? headToHeads(squads.info.matchups, squads.info.teams, squads.roundPeriod, teamId)
      : [];

  // Where each side stands, for the bracket under his name; no bracket when the table would not answer.
  const placing = placings(table);

  return (
    <TeamShell
      team={identify(team, slug)}
      current="next"
      empty={ties.length === 0 ? ["next"] : []}
    >
      {ties.length === 0 ? (
        <TabEmpty>{/* An outage and an ordinary bye are different absences. */}
            {squads.info === null
              ? "We cannot read the league's own description of itself right now."
              : `${team.teamName} has no fixture this gameweek.`}</TabEmpty>
      ) : (
        ties.map((tie) => (
          <Fixture
            key={tie.opponent.teamId}
            gameweek={squads.snapshot.gameweek}
            home={{ teamId: tie.team.teamId, name: shortName(tie.team.teamId, tie.team.name), place: placing.get(tie.team.teamId) }}
            away={{
              teamId: tie.opponent.teamId,
              name: shortName(tie.opponent.teamId, tie.opponent.name),
              place: placing.get(tie.opponent.teamId),
            }}
          />
        ))
      )}
    </TeamShell>
  );
}

/** The two sides, each on its own colour; no ground, so the team whose screen this is reads first. */
function Fixture({
  gameweek,
  home,
  away,
}: {
  gameweek: number;
  home: SideTeam;
  away: SideTeam;
}) {
  return (
    <section className={PANEL_FLUSH}>
      {/* The gameweek on an ordinary strip of its own (Craig, 2 Sep 2026); `cm-tab`, as the title bar carries a masthead's height. */}
      <div className="cm-tab flex items-center justify-center px-2 py-1">
        <span className={`numeric ${SMALL_CAPS} text-ink`}>Gameweek {gameweek}</span>
      </div>

      <div className="flex items-stretch gap-2 p-2">
        <Side team={home} />
        <span className={`flex shrink-0 items-center px-1 font-chrome ${LABEL}`}>
          v
        </span>
        <Side team={away} linked />
      </div>
    </section>
  );
}

interface SideTeam {
  teamId: string;
  name: string;
  /** Where he stands in the league, printed (`3rd`, `=1st`). Undefined when the table would not answer. */
  place: string | undefined;
}

function Side({ team, linked = false }: { team: SideTeam; linked?: boolean }) {
  const colours = teamColours(team.teamId);
  const label = (
    <span
      className="flex min-h-11 flex-1 flex-col items-center justify-center px-2 text-center leading-tight"
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      <span className="text-sm font-bold uppercase">{team.name}</span>
      {/* His placing under his name, on his own plate (Craig, 2 Sep; `cm9900/25.jpg`). */}
      {team.place === undefined ? null : (
        <span className="numeric text-3xs font-bold opacity-80">({team.place})</span>
      )}
    </span>
  );

  // Only the opponent links: a link to this page would be a dead control.
  return linked ? (
    <Link href={teamHref(team.teamId)} className="flex min-w-0 flex-1">
      {label}
    </Link>
  ) : (
    <span className="flex min-w-0 flex-1">{label}</span>
  );
}
