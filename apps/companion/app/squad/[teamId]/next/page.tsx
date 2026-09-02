import { headToHead, inkOn, teamColours } from "@epl/core";
import TeamShell from "../Shell";
import { getLeagueSquads } from "../../../squads";
import { planningRound } from "../../../round";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

// Who he plays, and the one screen in this app that is about a confrontation.
//
// **This is where a team's colour earns itself.** Championship Manager sets the
// two sides' own colours against each other in a match header — Everton's blue
// against Arsenal's red in `cm9900/21.jpg`, against Torquay's WHITE in `16.jpg`
// — and that is the whole of what club colour does in the game. It does not
// theme a page. So the squad's bar carries the team's plate because the screen
// is about him, and this screen carries two plates because it is about a
// fixture, and nothing else in the app carries one at all.
//
// The pairing costs no request: `LeagueInfo.matchups` is already in the payload
// every squad screen reads, and `headToHead` is the same selector the squad tab
// uses for the "v opponent" line in its subheading.

export const revalidate = 30;

export default async function NextMatchPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  // The whole read rather than `teamOr404`, because this screen needs the
  // matchups and the period as well as the name — one read either way.
  const squads = await getLeagueSquads(await planningRound());
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect("/squad");

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  const tie =
    squads.info !== null && squads.roundPeriod !== null
      ? headToHead(squads.info.matchups, squads.info.teams, squads.roundPeriod, teamId)
      : undefined;

  return (
    <TeamShell
      team={team}
      title="Next Match"
      current="next"
      empty={tie === undefined ? ["next"] : []}
      sub={
        <>
          Period {squads.roundPeriod ?? "—"} · Gameweek {squads.snapshot.gameweek}
        </>
      }
    >
      {tie === undefined ? (
        <section className="cm-panel px-3 py-6">
          <p className="text-center text-2xs text-muted">
            {/* Two different absences and only one of them is a fault. Fantrax
                not describing the league at all is an outage; the league simply
                not pairing this side in this period is an ordinary bye. */}
            {squads.info === null
              ? "We cannot read the league's own description of itself right now."
              : `${team.teamName} has no fixture in this period.`}
          </p>
        </section>
      ) : (
        <Fixture
          home={{ teamId: tie.team.teamId, name: tie.team.name }}
          away={{ teamId: tie.opponent.teamId, name: tie.opponent.name }}
        />
      )}
    </TeamShell>
  );
}

/** The two sides, each on its own colour.
 *
 *  Neither is at home — a fantasy fixture has no ground — so the team whose
 *  screen this is reads first, which is the rule every head-to-head surface in
 *  this app already follows. */
function Fixture({
  home,
  away,
}: {
  home: { teamId: string; name: string };
  away: { teamId: string; name: string };
}) {
  return (
    <section className="cm-panel flex flex-col gap-2 p-2">
      <div className="flex items-stretch gap-2">
        <Side team={home} />
        <span className="flex shrink-0 items-center px-1 font-chrome text-2xs font-bold uppercase text-faint">
          v
        </span>
        <Side team={away} linked />
      </div>
    </section>
  );
}

function Side({
  team,
  linked = false,
}: {
  team: { teamId: string; name: string };
  linked?: boolean;
}) {
  const colours = teamColours(team.teamId);
  const label = (
    <span
      className="flex min-h-11 flex-1 items-center justify-center px-2 text-center text-sm font-bold uppercase"
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      {team.name}
    </span>
  );

  // Only the opponent is a link: a link to the page you are on is a dead control
  // that still looks like a live one.
  return linked ? (
    <Link href={`/squad/${team.teamId}`} className="flex min-w-0 flex-1">
      {label}
    </Link>
  ) : (
    <span className="flex min-w-0 flex-1">{label}</span>
  );
}
