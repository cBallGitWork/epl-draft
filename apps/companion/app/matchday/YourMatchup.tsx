import Link from "@/app/components/shell/Link";
import { DASH, headToHeads, type LeagueTeam, type LiveTeamScore, inkOn } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import { liveScores } from "../scoreboard";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursMark } from "../mine";
import { matchupHref } from "@/app/league/routes";
import { BAR_TITLE, PANEL } from "@/app/desk";

// Your head-to-head in CM's match header, both of a double header's; renders nothing when signed out or before the draft.

export default async function YourMatchup() {
  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return null;

  const period = squads.roundPeriod;
  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return null;

  // You on the left: Fantrax's home and away mean nothing here.
  const ties = headToHeads(squads.info.matchups, squads.info.teams, period, mine);
  if (ties.length === 0) return null;

  const { scores } = await liveScores(period);

  return (
    <section className={PANEL}>
      {ties.map((pairing) => {
        // Only a double header names the tie each side's page opens on.
        const double = ties.length > 1;
        return (
          <div key={pairing.opponent.teamId} className="flex items-stretch">
            <Half team={pairing.team} vs={double ? pairing.opponent.teamId : undefined} score={scores.get(pairing.team.teamId)} mine />
            <Half team={pairing.opponent} vs={double ? pairing.team.teamId : undefined} score={scores.get(pairing.opponent.teamId)} />
          </div>
        );
      })}
    </section>
  );
}

function Half({
  team,
  vs,
  score,
  mine = false,
}: {
  team: LeagueTeam;
  /** The other side, when his page must be told which of two ties to open on. */
  vs: string | undefined;
  score: LiveTeamScore | undefined;
  mine?: boolean;
}) {
  const points = score?.points ?? null;
  const colours = teamColours(team.teamId);
  const ink = inkOn(colours);

  return (
    // Managers on club plates (`inkOn` handles a pale one); neither is mirrored, and each
    // score sits at its own plate's right edge (Craig, 4 Sep 2026).
    <div
      className={`flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${yoursMark(mine)}`}
      style={{ background: colours.primary }}
    >
      <Link
        href={matchupHref(team.teamId, undefined, undefined, vs)}
        className="flex min-w-0 flex-1 items-center self-stretch px-2"
      >
        {/* No accent ink on a colour plate, so the left edge marks yours. */}
        <span
          className={`${BAR_TITLE} text-base lg:text-2xl`}
          style={{ color: ink }}
        >
          {team.name}
        </span>
      </Link>
      {/* The plate owns its ink: no `text-*` or `ScoreFigure` here (ink on the bevel is 2.27:1), so the dash is by hand. */}
      {/* `w-14` holds a four-character total (`61.4`); any wider clips the away name at 390. */}
      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? DASH : points}
      </span>
    </div>
  );
}
