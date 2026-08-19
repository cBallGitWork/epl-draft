import Link from "next/link";
import { LEAGUE_NAME, type RosteredTeam, isResolved } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { londonDate } from "../londonTime";
import SignIn from "./SignIn";
import { forgetTeam } from "./actions";
import { getLeagueSquads } from "../squads";
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
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <Nothing title={FANTRAX_SILENT} code={squads.unavailable}>
        The league is fine. We just cannot read it right now, so rather than guess at your squad
        this says nothing.
      </Nothing>
    );
  }

  if ("undrafted" in squads) {
    return (
      <Nothing title="Nobody has a squad yet" code={squads.undrafted}>
        {LEAGUE_NAME} drafts on {DRAFT_DATE}. Until then Fantrax has a competition and no teams in
        it, so there is nothing to line up.
      </Nothing>
    );
  }

  const mine = await myTeamId(squads.period.teams);
  const others = squads.period.teams.filter((team) => team.teamId !== mine);
  const yours = squads.period.teams.find((team) => team.teamId === mine);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={yours ? "Your squad" : "Squads"} />

      {yours ? (
        <>
          <Squad team={yours} lead />
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
            <Squad team={team} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One squad as a row. `lead` is the partisan treatment: yours sits above the
 *  rest, framed, because this app is meant to know whose team you are. */
function Squad({ team, lead = false }: { team: RosteredTeam; lead?: boolean }) {
  const unresolved = team.players.filter((player) => !isResolved(player)).length;

  return (
    <Link
      href={`/squad/${team.teamId}`}
      className={`elev flex min-h-14 items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 hover:bg-raised ${yoursBorder(
        lead,
      )}`}
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{team.teamName}</span>
      {/* A label, not just an accent: the border alone carries no meaning to
          anyone who cannot see it. */}
      {lead ? (
        <span className="rounded bg-raised px-1.5 py-0.5 text-2xs font-bold uppercase tracking-widest text-accent">
          You
        </span>
      ) : null}
      <span className="numeric text-sm text-muted">{team.players.length}</span>
      {/* Never silently short. A squad we cannot fully identify says so here
          rather than rendering fourteen of fifteen on the pitch. */}
      {unresolved > 0 ? (
        <span className="numeric rounded bg-raised px-1.5 py-0.5 text-2xs font-bold text-mid">
          {unresolved} unmapped
        </span>
      ) : null}
    </Link>
  );
}
