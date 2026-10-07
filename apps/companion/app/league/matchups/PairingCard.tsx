import Link from "@/app/components/shell/Link";
import type { LeagueTeam, LiveTeamScore, PeriodPairing, PendingCleanSheets } from "@epl/core";
import { pairingInvolves } from "@epl/core";
import ScoreFigure from "../../components/league/ScoreFigure";
import { yoursBorder, yoursInk } from "../../mine";
import Pending from "../../components/league/Pending";
import { LABEL, ROW_NAME } from "@/app/desk";
import { matchupHref } from "../routes";

// One head-to-head on the board: name, score, v, score, name, so the margin is the answer. The labelled second line
// carries what each side has left to play and the clean sheets Fantrax has not credited (Craig, 19 Aug).

export default function PairingCard({
  pairing,
  scores,
  pending,
  mine,
  underway,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  pending: Map<string, PendingCleanSheets>;
  /** The reader's own team, or null when nobody is signed in. */
  mine: string | null;
  /** Whether the round is under way, gaps between kickoffs included: only then does "all played" say anything. */
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
          mine={pairing.home.teamId === mine}
        />
        <span className={`self-center px-1 ${LABEL}`}>
          v
        </span>
        <Side
          team={pairing.away}
          score={away}
          against={home}
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

/** One half of the scoreline and the way into that side's board; `mirrored` puts the away name on the outside edge. */
function Side({
  team,
  score,
  against,
  mine,
  mirrored = false,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  against: LiveTeamScore | undefined;
  mine: boolean;
  mirrored?: boolean;
}) {
  const points = score?.points ?? null;
  const other = against?.points ?? null;

  return (
    // Into the pairing's board, opened on the tapped side; each squad is a tap further.
    <Link
      href={matchupHref(team.teamId)}
      className={`cm-row flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 hover:bg-raised ${
        mirrored ? "flex-row-reverse" : ""
      }`}
    >
      <span
        className={`min-w-0 flex-1 truncate ${ROW_NAME} ${
          mirrored ? "text-right" : "text-left"
        } ${yoursInk(mine)}`}
      >
        {team.name}
      </span>
      {/* Only the number dims, and only when both sides have one: a name keeps the accent's meaning. */}
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
  // Per side; zero is a statement, so the number is read, not its truthiness. A copy of `YourMatchup`'s line: two
  // (CODE_RULES §1), and the two must agree.
  const left =
    score?.toPlay == null
      ? null
      : score.toPlay > 0
        ? `${score.toPlay} to play`
        : underway
          ? "all played"
          : null;

  // Nought, null and no table all mean nothing is owed, as `league/Pending` reads it.
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
