import Link from "next/link";
import { type LeagueTeam, type LiveTeamScore, type PendingCleanSheets, headToHead } from "@epl/core";
import { liveScores, pendingByTeam } from "../scoreboard";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";

// Your head-to-head, at the top of the live view.
//
// The whole point of the Matchday tab: not "what is happening in the Premier
// League" — that is below — but "am I winning". It renders nothing at all when
// there is nothing to say, so a reader who has not signed in, or whose league
// has not drafted, gets the football and no empty furniture.

export default async function YourMatchup() {
  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.period.period === null) return null;

  const period = squads.period.period;
  const mine = await myTeamId(squads.period.teams);
  if (mine === null) return null;

  // You on the left, whoever it is on the right. Fantrax's home and away mean
  // nothing here — there is no ground — and a manager reads his own score first.
  const pairing = headToHead(squads.info.matchups, squads.info.teams, period, mine);
  if (!pairing) return null;

  const [{ scores }, pending] = [
    await liveScores(period),
    pendingByTeam(squads.period.teams, squads.info.scoring, squads.snapshot, squads.display),
  ];

  return (
    <section className={`elev flex flex-col gap-2 rounded-xl border bg-surface p-3 ${yoursBorder(true)}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xs font-bold uppercase tracking-widest text-faint">
          Your head-to-head
        </h2>
        <Link
          href={`/league/matchups/${pairing.team.teamId}`}
          className="text-2xs text-faint hover:text-muted"
        >
          Both elevens
        </Link>
      </div>

      <div className="flex items-stretch gap-2">
        <Half
          team={pairing.team}
          score={scores.get(pairing.team.teamId)}
          pending={pending.get(pairing.team.teamId)}
          mine
        />
        <span className="self-center text-2xs font-bold uppercase tracking-widest text-faint">v</span>
        <Half
          team={pairing.opponent}
          score={scores.get(pairing.opponent.teamId)}
          pending={pending.get(pairing.opponent.teamId)}
        />
      </div>
    </section>
  );
}

function Half({
  team,
  score,
  pending,
  mine = false,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  mine?: boolean;
}) {
  return (
    // Into the head-to-head board, opened on the side that was tapped. The
    // summary answers "am I winning"; the board is where the players behind the
    // number are, which is the question the number provokes.
    <Link
      href={`/league/matchups/${team.teamId}`}
      className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2 py-1.5 hover:bg-raised"
    >
      <span className={`truncate text-sm ${mine ? "font-bold text-ink" : "font-semibold text-muted"}`}>
        {team.name}
      </span>
      <span className="flex items-baseline gap-1.5">
        {/* The live number is the interface: biggest thing on the card. */}
        <span className="numeric text-3xl font-bold leading-none">{score?.points ?? "—"}</span>
        {pending && pending.points > 0 ? (
          <span className="numeric text-sm font-semibold text-accent">+{pending.points}</span>
        ) : null}
      </span>
      {score?.toPlay ? (
        <span className="text-2xs text-faint">{score.toPlay} to play</span>
      ) : null}
    </Link>
  );
}
