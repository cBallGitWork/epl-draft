import Link from "next/link";
import type { LeagueTeam, LiveTeamScore, PeriodPairing, PendingCleanSheets } from "@epl/core";
import { pairingInvolves } from "@epl/core";
import TeamBadge from "../../components/league/TeamBadge";
import { yoursBorder } from "../../mine";

// One head-to-head on the list of eight.
//
// It was two stacked rows, which made eight identical cards: a reader looking
// for "who is having a good week" had to compare two numbers in different places
// on the screen, eight times over, and that is the one thing a scoreline exists
// not to make you do. Now it is the board's grammar — name, score, v, score,
// name — so the margin between two adjacent numbers *is* the answer, and no
// invented threshold decides what counts as close.
//
// The second line carries the labelled extras a scoreline may not: how many each
// side has still to play, and the clean sheets Fantrax has not credited yet. A
// scoreline is one row and takes one number per side (Craig, 19 Aug); anything
// else has to be beneath it, wearing its label.

export default function PairingCard({
  pairing,
  scores,
  pending,
  badges,
  mine,
  live,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  pending: Map<string, PendingCleanSheets>;
  /** Each manager's own badge, by team id. Empty is ordinary and draws his
   *  initial instead — see `TeamBadge`. */
  badges: Map<string, string>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
  /** Whether football is actually in play. Only then does a side with nobody
   *  left to play have said anything: on a Wednesday every side has nobody
   *  left, and "all played" would be sixteen statements of the obvious. */
  live: boolean;
}) {
  const home = scores.get(pairing.home.teamId);
  const away = scores.get(pairing.away.teamId);

  return (
    <div
      className={`elev flex flex-col rounded-xl border bg-surface ${yoursBorder(
        pairingInvolves(pairing, mine),
      )}`}
    >
      <div className="flex items-stretch">
        <Side
          team={pairing.home}
          score={home}
          against={away}
          badges={badges}
          mine={pairing.home.teamId === mine}
        />
        <span className="self-center px-1 text-2xs font-bold uppercase tracking-widest text-faint">
          v
        </span>
        <Side
          team={pairing.away}
          score={away}
          against={home}
          badges={badges}
          mine={pairing.away.teamId === mine}
          mirrored
        />
      </div>

      <div className="flex items-baseline justify-between gap-2 px-3 pb-1.5">
        <Extras score={home} pending={pending.get(pairing.home.teamId)} live={live} />
        <Extras
          score={away}
          pending={pending.get(pairing.away.teamId)}
          live={live}
          align="end"
        />
      </div>
    </div>
  );
}

/** One half of the scoreline, and the link into that side of the board.
 *
 *  `mirrored` turns it round for the away half, so both numbers meet in the
 *  middle either side of the "v" and both names sit at the outside edges — the
 *  same arrangement as `MatchupBoard`, because it is the same scoreline read at
 *  a different size. */
function Side({
  team,
  score,
  against,
  badges,
  mine,
  mirrored = false,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  against: LiveTeamScore | undefined;
  badges: Map<string, string>;
  mine: boolean;
  mirrored?: boolean;
}) {
  const points = score?.points ?? null;
  const other = against?.points ?? null;
  // Nobody is behind while a total is missing: a dash is not a low score.
  const behind = points !== null && other !== null && points < other;

  return (
    // Into the pairing's own board, opened on the side that was tapped — not
    // into the squad. Both halves lead to the same head-to-head and it arrives
    // showing whichever name the thumb landed on, which is the whole of what
    // "tap a team" means here. Each squad is one further tap, from there.
    <Link
      href={`/league/matchups/${team.teamId}`}
      className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 hover:bg-raised ${
        mirrored ? "flex-row-reverse" : ""
      }`}
    >
      <TeamBadge team={team} url={badges.get(team.teamId)} />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold ${
          mirrored ? "text-right" : "text-left"
        } ${mine ? "text-accent" : "text-ink"}`}
      >
        {team.name}
      </span>
      {/* Only the number dims, and only when both sides have one. The name keeps
          its own register — accent means "yours" on six screens and would stop
          meaning it if a name could also dim for losing. A dash dims nobody. */}
      <span
        className={`numeric shrink-0 text-xl font-bold leading-none ${
          behind ? "text-muted" : "text-ink"
        }`}
      >
        {points ?? "—"}
      </span>
    </Link>
  );
}

/** The labelled second line for one side. Renders nothing when there is nothing
 *  to label, which is most of the week. */
function Extras({
  score,
  pending,
  live,
  align = "start",
}: {
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  live: boolean;
  align?: "start" | "end";
}) {
  // Per side, not per league: once football is on, one manager has three players
  // left and the other has none, and that difference is most of what a
  // head-to-head screen is for. Literal zero is a statement, not an absence —
  // which is why this reads the number rather than its truthiness.
  const left =
    score?.toPlay == null
      ? null
      : score.toPlay > 0
        ? `${score.toPlay} to play`
        : live
          ? "all played"
          : null;

  if (left === null && !(pending && pending.points > 0)) return <span />;

  return (
    <span
      className={`flex min-w-0 items-baseline gap-2 text-2xs ${
        align === "end" ? "flex-row-reverse" : ""
      }`}
    >
      {left ? <span className="truncate text-faint">{left}</span> : null}
      {/* Kept beside the score rather than folded into it. Fantrax's number stays
          Fantrax's; this is the bit they have not credited yet. */}
      {pending && pending.points > 0 ? (
        <span className="numeric shrink-0 font-semibold text-accent">+{pending.points}</span>
      ) : null}
    </span>
  );
}
