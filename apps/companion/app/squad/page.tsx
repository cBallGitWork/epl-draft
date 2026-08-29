import Link from "next/link";
import { LEAGUE_NAME, type RosteredTeam, headToHead, isResolved } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { londonDate } from "../londonTime";
import SignIn from "./SignIn";
import { forgetTeam } from "./actions";
import { getLeagueSquads, planningRound } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";
import { FANTRAX_SILENT, servedLeague } from "../config";

// Your squad, and everyone else's. Until the draft this is the empty state,
// which is the state our real league is actually in and therefore the one that
// has to be designed rather than defaulted.
//
// Reading the session cookie makes this route dynamic, which is the price of the
// app knowing whose team you are. The provider reads underneath it are cached
// (see `league.ts`), so the page rendering per request does not mean Fantrax and
// FPL being asked per request.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Draft night for the league we are actually serving — §3 keeps season dates in
 *  config, and the two leagues draft nine weeks apart. */
const DRAFT_DATE = londonDate(
  servedLeague()?.draftDate ?? "",
);

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
        <Nothing title={FANTRAX_SILENT} code={squads.unavailable}>
          The league is fine. We just cannot read it right now, so rather than guess at your squad
          this says nothing.
        </Nothing>
        <SignIn />
      </div>
    );
  }

  if ("undrafted" in squads) {
    return (
      <div className="flex flex-col gap-3">
        <Nothing title="Nobody has a squad yet" code={squads.undrafted}>
          {LEAGUE_NAME} drafts on {DRAFT_DATE}. Until then Fantrax has a competition and no teams
          in it, so there is nothing to line up.
        </Nothing>
        <SignIn />
      </div>
    );
  }

  const mine = await myTeamId(squads.period.teams);
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

      {yours ? (
        <>
          <Squad team={yours} opponent={opponentOf(yours.teamId)} lead />
          <form action={forgetTeam} className="px-3">
            <button type="submit" className="min-h-11 text-2xs text-faint hover:text-muted">
              Not you? Sign out
            </button>
          </form>
          <h2 className="px-3 pt-1 text-2xs font-bold uppercase tracking-widest text-faint">
            Around the league
          </h2>
        </>
      ) : (
        <SignIn />
      )}

      <ul className="flex flex-col gap-1.5">
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
      href={`/squad/${team.teamId}`}
      className={`elev flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-raised ${
        lead ? "bg-raised" : "bg-surface"
      } ${yoursBorder(lead)}`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{team.teamName}</span>
        {/* The row was a name and a number, sixteen times. Who he plays this
            week is the thing that makes it a fixture list rather than a
            directory, and it costs nothing: the schedule is already in the
            payload this page fetched. */}
        {opponent ? (
          <span className="truncate text-2xs text-faint">
            <span className="uppercase tracking-widest">v</span> {opponent}
          </span>
        ) : null}
      </span>
      {/* A label, not just an accent: the border alone carries no meaning to
          anyone who cannot see it. On `bg-bg` because the row it sits on is
          raised, and a chip the colour of its ground is not a chip. */}
      {lead ? (
        <span className="rounded bg-bg px-1.5 py-0.5 text-2xs font-bold uppercase tracking-widest text-accent">
          You
        </span>
      ) : null}
      <span className="numeric shrink-0 text-sm text-muted">{team.players.length}</span>
      {/* Never silently short. A squad we cannot fully identify says so here
          rather than rendering fourteen of fifteen on the pitch. */}
      {unresolved > 0 ? (
        <span className="numeric shrink-0 rounded bg-bg px-1.5 py-0.5 text-2xs font-bold text-mid">
          {unresolved} unmapped
        </span>
      ) : null}
    </Link>
  );
}
