import Link from "next/link";
import { headToHead, type LeagueTeam, type LiveTeamScore, inkOn, teamColours } from "@epl/core";
import { liveScores } from "../scoreboard";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";
import { matchupHref } from "@/app/league/routes";

// Your head-to-head in CM's match header; renders nothing when signed out or before the draft.

export default async function YourMatchup() {
  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return null;

  const period = squads.roundPeriod;
  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return null;

  // You on the left: Fantrax's home and away mean nothing here.
  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, mine);
  if (!pairing) return null;

  const { scores } = await liveScores(period);
  const yours = scores.get(pairing.team.teamId);
  const theirs = scores.get(pairing.opponent.teamId);

  return (
    <section className={`cm-panel flex flex-col gap-2 p-2 ${yoursBorder(true)}`}>
      <div className="flex items-stretch">
        <Half team={pairing.team} score={yours} mine />
        <Half team={pairing.opponent} score={theirs} />
      </div>

    </section>
  );
}

function Half({
  team,
  score,
  mine = false,
}: {
  team: LeagueTeam;
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
      className={`flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${
        mine ? "border-l-4 border-l-accent" : ""
      }`}
      style={{ background: colours.primary }}
    >
      <Link
        href={matchupHref(team.teamId)}
        className="flex min-w-0 flex-1 items-center self-stretch px-2"
      >
        {/* No accent ink on a colour plate, so the left edge marks yours. */}
        <span
          className="cm-title min-w-0 flex-1 truncate font-chrome text-base font-bold uppercase lg:text-2xl"
          style={{ color: ink }}
        >
          {team.name}
        </span>
      </Link>
      {/* The plate owns its ink: no `text-*` or `ScoreFigure` here (ink on the bevel is 2.27:1), so the dash is by hand. */}
      {/* `w-14` holds a four-character total (`61.4`); any wider clips the away name at 390. */}
      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? "\u2014" : points}
      </span>
    </div>
  );
}
