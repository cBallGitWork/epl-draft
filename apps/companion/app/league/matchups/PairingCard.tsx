import Link from "next/link";
import type { LeagueTeam, LiveTeamScore, PeriodPairing, PendingCleanSheets } from "@epl/core";
import { pairingInvolves } from "@epl/core";
import ScoreFigure from "../../components/league/ScoreFigure";
import TeamBadge from "../../components/league/TeamBadge";
import { yoursBorder, yoursInk } from "../../mine";
import Pending from "../../components/league/Pending";
import { LABEL, ROW_NAME } from "@/app/desk";
import { matchupHref } from "../routes";

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
  underway,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  pending: Map<string, PendingCleanSheets>;
  /** Each manager's own badge, by team id. Empty is ordinary and draws his
   *  initial instead — see `TeamBadge`. */
  badges: Map<string, string>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
  /** Whether the round is under way — not whether a ball is in the air.
   *
   *  Only then does a side with nobody left have said anything: on a Wednesday
   *  every side has nobody left and "all played" would be sixteen statements of
   *  the obvious. But this was `isMatchdayLive`, which is false in every gap
   *  between kickoffs — and in those gaps the other half of the same line, "4 to
   *  play", printed anyway. One side spoke and the other was silent, which reads
   *  as missing data rather than as the fact it is. */
  underway: boolean;
}) {
  const home = scores.get(pairing.home.teamId);
  const away = scores.get(pairing.away.teamId);

  return (
    <div
      className={`flex flex-col ${yoursBorder(
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
        <span className={`self-center px-1 ${LABEL}`}>
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
        <Extras score={home} pending={pending.get(pairing.home.teamId)} underway={underway} />
        <Extras
          score={away}
          pending={pending.get(pairing.away.teamId)}
          underway={underway}
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

  return (
    // Into the pairing's own board, opened on the side that was tapped — not
    // into the squad. Both halves lead to the same head-to-head and it arrives
    // showing whichever name the thumb landed on, which is the whole of what
    // "tap a team" means here. Each squad is one further tap, from there.
    <Link
      href={matchupHref(team.teamId)}
      className={`cm-row flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 hover:bg-raised ${
        mirrored ? "flex-row-reverse" : ""
      }`}
    >
      <TeamBadge team={team} url={badges.get(team.teamId)} />
      <span
        className={`min-w-0 flex-1 truncate ${ROW_NAME} ${
          mirrored ? "text-right" : "text-left"
        } ${yoursInk(mine)}`}
      >
        {team.name}
      </span>
      {/* Only the number dims, and only when both sides have one. The name keeps
          its own register — accent means "yours" on six screens and would stop
          meaning it if a name could also dim for losing. A dash dims nobody. */}
      <ScoreFigure
        points={points}
        other={other}
        className="numeric shrink-0 text-xl font-bold leading-none"
      />
    </Link>
  );
}

/** The labelled second line for one side. Renders nothing when there is nothing
 *  to label, which is most of the week. */
function Extras({
  score,
  pending,
  underway,
  align = "start",
}: {
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  underway: boolean;
  align?: "start" | "end";
}) {
  // Per side, not per league: once football is on, one manager has three players
  // left and the other has none, and that difference is most of what a
  // head-to-head screen is for. Literal zero is a statement, not an absence —
  // which is why this reads the number rather than its truthiness.
  //
  // Deliberately a copy of `YourMatchup`'s line and not an extraction: second
  // occurrence (CODE_RULES §1), and the two must agree, which is the whole
  // reason this comment names the other one. The pending mark that used to be
  // the other half of the copy reached four screens on 31 Aug and is
  // `league/Pending` now.
  const left =
    score?.toPlay == null
      ? null
      : score.toPlay > 0
        ? `${score.toPlay} to play`
        : underway
          ? "all played"
          : null;

  // The same truthiness `league/Pending` applies, spelled the same way: nought,
  // null and no-table-at-all all mean nothing is owed. It was
  // `!(pending && pending.points > 0)`, which is a third way of writing a rule
  // that only needs one.
  if (left === null && !pending?.points) return <span />;

  return (
    <span
      className={`flex min-w-0 items-baseline gap-2 text-2xs ${
        align === "end" ? "flex-row-reverse" : ""
      }`}
    >
      {left ? <span className="truncate text-faint">{left}</span> : null}
      <Pending points={pending?.points} />
    </span>
  );
}
