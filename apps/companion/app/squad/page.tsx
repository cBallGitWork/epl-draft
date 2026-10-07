import Link from "@/app/components/shell/Link";
import { LEAGUE_NAME, type RosteredTeam, headToHead, isResolved } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import SignIn from "./SignIn";
import { forgetTeam } from "./actions";
import { getLeagueSquads } from "../squads";
import { planningRound } from "../round";
import { myTeamId, signedIn } from "../session";
import { yoursBorder } from "../mine";
import { MY_TEAM, teamHref } from "./routes";
import { PANEL, ROW_NAME, HEADING_PLATE } from "@/app/desk";
import FantraxSilent from "../components/shell/FantraxSilent";
import { shortName } from "../teamNames";

// Your squad, then everyone else's. The cookie makes the route dynamic; the reads under it are cached.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function SquadsPage() {
  // The week a manager can still change: from Friday teatime that is next week, not the one in play.
  const squads = await getLeagueSquads(await planningRound());

  // Both empty states keep the sign-in form: this is the only place a code goes in, and signing in needs no Fantrax.
  if ("unavailable" in squads) {
    return (
      <div className="flex flex-col gap-3">
        <section className={PANEL}>
          <FantraxSilent code={squads.unavailable}>
            The league is fine. We just cannot read it right now, so rather than guess at your squad
            this says nothing.
          </FantraxSilent>
        </section>
        <SignIn />
      </div>
    );
  }

  if ("undrafted" in squads) {
    return (
      <div className="flex flex-col gap-3">
        <section className={PANEL}>
          <Nothing title="Nobody has a squad yet" code={squads.undrafted}>
            {LEAGUE_NAME} has not drafted yet. Until then Fantrax has a competition and no teams
            in it, so there is nothing to line up.
          </Nothing>
        </section>
        <SignIn />
      </div>
    );
  }

  const [mine, holder] = await Promise.all([myTeamId(squads.period.teams), signedIn()]);
  const others = squads.period.teams.filter((team) => team.teamId !== mine);
  const yours = squads.period.teams.find((team) => team.teamId === mine);

  // Who each plays this week, off the schedule already in the payload; no line when it does not say.
  const period = squads.roundPeriod;
  const opponentOf = (teamId: string) =>
    squads.info === null || period === null
      ? null
      : (headToHead(squads.info.matchups, squads.info.teams, period, teamId)?.opponent ?? null);
  const opponentName = (teamId: string) => {
    const opponent = opponentOf(teamId);
    return opponent === null ? null : shortName(opponent.teamId, opponent.name);
  };

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={yours ? "Your squad" : "Squads"} />

      {yours ? <Squad team={yours} opponent={opponentName(yours.teamId)} lead /> : null}

      {/* The sign-in follows the code, not the team on screen; signing out is offered only to a real code. */}
      {holder ? (
        <form action={forgetTeam} className="cm-panel px-3">
          <button type="submit" className="min-h-11 text-2xs text-faint hover:text-muted">
            Not you? Sign out
          </button>
        </form>
      ) : (
        <SignIn />
      )}

      {/* A plate of its own: nothing prints on the bare ground (DESIGN §2). */}
      {yours ? <h2 className={HEADING_PLATE}>Around the league</h2> : null}

      <ul className="cm-rows flex flex-col">
        {others.map((team) => (
          <li key={team.teamId}>
            <Squad team={team} opponent={opponentName(team.teamId)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One squad as a row. `lead` is the partisan treatment: yours sits above the
 *  rest, framed, because this app is meant to know whose team you are. */
function Squad({
  team,
  opponent,
  lead = false,
}: {
  team: RosteredTeam;
  /** Who he plays this period, or null when the schedule does not say. */
  opponent: string | null;
  lead?: boolean;
}) {
  const unresolved = team.players.filter((player) => !isResolved(player)).length;

  return (
    <Link
      // Your own row goes through the front door, so the rail's plate stays lit.
      href={lead ? MY_TEAM : teamHref(team.teamId)}
      className={`cm-row flex min-h-14 items-center gap-3 px-3 py-2.5 hover:bg-raised ${
        lead ? "bg-raised" : "bg-surface"
      } ${yoursBorder(lead)}`}
    >
      <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>{team.teamName}</span>
        {/* Who he plays this week. */}
        {opponent ? (
          <span className="shrink-0 truncate text-2xs text-faint">
            <span className="uppercase">v</span> {opponent}
          </span>
        ) : null}
      </span>
      {/* No YOU chip (Craig, 5 Sep 2026): the accent edge and the top place pair with the colour. */}
      <span className="numeric shrink-0 text-sm text-muted">{team.players.length}</span>
      {/* Never silently short: a squad we cannot fully identify says so. */}
      {unresolved > 0 ? (
        <span className="numeric shrink-0 bg-bg px-1.5 py-0.5 text-2xs font-bold text-mid">
          {unresolved} unmapped
        </span>
      ) : null}
    </Link>
  );
}
