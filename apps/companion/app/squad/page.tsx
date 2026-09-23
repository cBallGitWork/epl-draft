import Link from "next/link";
import { LEAGUE_NAME, type RosteredTeam, headToHead, isResolved } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import SignIn from "./SignIn";
import { forgetTeam } from "./actions";
import { getLeagueSquads } from "../squads";
import { planningRound } from "../round";
import { myTeamId, signedIn } from "../session";
import { yoursBorder } from "../mine";
import { MY_TEAM, SQUAD } from "./routes";
import { LABEL, PANEL, ROW_NAME } from "@/app/desk";
import FantraxSilent from "../components/shell/FantraxSilent";

// Your squad, and everyone else's. Until the draft this is the empty state,
// which is the state our real league is actually in and therefore the one that
// has to be designed rather than defaulted.
//
// Reading the session cookie makes this route dynamic, which is the price of the
// app knowing whose team you are. The provider reads underneath it are cached
// (see `league.ts`), so the page rendering per request does not mean Fantrax and
// FPL being asked per request.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function SquadsPage() {
  // The week a manager can still change, which from Friday teatime is next week
  // and not the one being played. Fantrax hands over the live period to a read
  // that does not ask, so this page spent every weekend showing an arrangement
  // nobody could alter; the running score belongs to Live.
  const squads = await getLeagueSquads(await planningRound());

  // Both empty states keep the sign-in form under them, and that is not a
  // decoration. This route is the ONLY place a manager can enter his code, and
  // the two states below are exactly the ones our real league is in every day
  // until 10 Oct — so without it nobody could sign in during the whole run-up,
  // or at any moment Fantrax was unreachable on the day. Signing in needs no
  // Fantrax at all: the code is checked against `TEAM_CODES` and the cookie is
  // signed with `SESSION_SECRET`, both ours (see `squad/actions.ts`).
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

  // Who each of them plays this week. Free — the schedule is already in the
  // payload this page has fetched — and it is the fact that turns a directory of
  // sixteen names into the week's fixtures. Undefined is ordinary: no schedule
  // for this period, or Fantrax would not describe the league, and it renders as
  // no line rather than as a guess.
  const period = squads.roundPeriod;
  const opponentOf = (teamId: string) =>
    squads.info === null || period === null
      ? null
      : (headToHead(squads.info.matchups, squads.info.teams, period, teamId)?.opponent.name ??
        null);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={yours ? "Your squad" : "Squads"} />

      {yours ? <Squad team={yours} opponent={opponentOf(yours.teamId)} lead /> : null}

      {/* **The sign-in follows the CODE, not the team on screen**, and it sits
          here rather than under the heading below: a reader being lent a squad is
          being asked who he is, and that question belongs beside his squad and
          not in the middle of the league's.

          It used to be the `else` of the branch above, which was the same
          question while the only way to have a team was to have signed in for
          one. The demo team broke that — the form left with the empty state, and
          `/squad` is the ONE place in the app a manager can enter his code, on
          the league this app serves by default all the way to 10 Oct.

          Signing OUT is the other half: offered only to a real code, because a
          button that drops you back onto the team the league lent you does
          nothing a reader can see. */}
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
      {yours ? <h2 className={`cm-panel px-2 py-1 text-center ${LABEL}`}>Around the league</h2> : null}

      <ul className="cm-rows flex flex-col">
        {others.map((team) => (
          <li key={team.teamId}>
            <Squad team={team} opponent={opponentOf(team.teamId)} />
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
      // Your own row goes through the front door, so the rail's plate stays lit
      // on the screens behind it. Everyone else is reached by id.
      href={lead ? MY_TEAM : `${SQUAD}/${team.teamId}`}
      className={`cm-row flex min-h-14 items-center gap-3 px-3 py-2.5 hover:bg-raised ${
        lead ? "bg-raised" : "bg-surface"
      } ${yoursBorder(lead)}`}
    >
      <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>{team.teamName}</span>
        {/* The row was a name and a number, sixteen times. Who he plays this
            week is the thing that makes it a fixture list rather than a
            directory, and it costs nothing: the schedule is already in the
            payload this page fetched. */}
        {opponent ? (
          <span className="shrink-0 truncate text-2xs text-faint">
            <span className="uppercase">v</span> {opponent}
          </span>
        ) : null}
      </span>
      {/* **No YOU chip** (Craig, 5 Sep 2026: "Remove 'you' from all rows where it
          appears. Just use yellow text for the team"). It was here because a
          border alone carries nothing to a reader who cannot see it — and the
          pairing docs/rules/PRODUCT.md asks for is still there without the chip: the accent
          EDGE is a position, and this row is sorted to the top of the list,
          which is a second one. */}
      <span className="numeric shrink-0 text-sm text-muted">{team.players.length}</span>
      {/* Never silently short. A squad we cannot fully identify says so here
          rather than rendering fourteen of fifteen on the pitch. */}
      {unresolved > 0 ? (
        <span className="numeric shrink-0 bg-bg px-1.5 py-0.5 text-2xs font-bold text-mid">
          {unresolved} unmapped
        </span>
      ) : null}
    </Link>
  );
}
