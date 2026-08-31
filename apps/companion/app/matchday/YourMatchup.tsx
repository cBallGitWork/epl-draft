import Link from "next/link";
import {
  headToHead,
  roundState,
  type LeagueTeam,
  type LiveTeamScore,
  type PendingCleanSheets,
} from "@epl/core";
import RoundWord from "../components/league/RoundWord";
import ScoreFigure from "../components/league/ScoreFigure";
import { liveScores, pendingByTeam } from "../scoreboard";
import { roundUnderway } from "../football";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";
import Pending from "../components/league/Pending";

// Your head-to-head, at the top of the live view.
//
// The whole point of the Matchday tab: not "what is happening in the Premier
// League" — that is below — but "am I winning". It renders nothing at all when
// there is nothing to say, so a reader who has not signed in, or whose league
// has not drafted, gets the football and no empty furniture.
//
// One scoreline row, the same grammar as the head-to-head board and the
// matchups list. It was two stacked halves, which is a different design for the
// same fact one tap away from the board that already reads it correctly — and a
// scoreline exists so two numbers can be compared without moving your eyes
// across the screen. The board stays one tap behind: this answers "am I
// winning", and the board answers "with whom", which is the question the number
// provokes rather than the question itself.

export default async function YourMatchup() {
  const squads = await getLeagueSquads();
  if (!("period" in squads) || squads.info === null || squads.roundPeriod === null) return null;

  const period = squads.roundPeriod;
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

  const yours = scores.get(pairing.team.teamId);
  const theirs = scores.get(pairing.opponent.teamId);
  const state = roundState(squads.snapshot);
  // Not `state === "live"`. "All played" is worth saying through the gaps
  // between kickoffs too, and the same line's other half already prints there.
  const underway = roundUnderway(squads.snapshot);

  return (
    <section className={`cm-panel flex flex-col gap-2 p-3 ${yoursBorder(true)}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xs font-bold uppercase text-faint">
          Your head-to-head
        </h2>
        <Link
          href={`/league/matchups/${pairing.team.teamId}`}
          // A 44px target inside a 28px header row: the negative margin lets the
          // tap area grow past the line without the panel growing with it, which
          // is the only way a header row keeps both its height and its rule.
          className="-my-2 flex min-h-11 items-center text-2xs text-faint hover:text-muted"
        >
          Both elevens
        </Link>
      </div>

      <div className="flex items-stretch">
        <Half team={pairing.team} score={yours} against={theirs} mine />
        <span className="self-center px-1 text-2xs font-bold uppercase text-faint">
          v
        </span>
        <Half team={pairing.opponent} score={theirs} against={yours} mirrored />
      </div>

      {/* Everything a scoreline may not carry, wearing its label. The state word
          sits between the two sides because it belongs to neither. */}
      <div className="flex items-baseline justify-between gap-2 text-2xs">
        <Extras score={yours} pending={pending.get(pairing.team.teamId)} underway={underway} />
        <span className="shrink-0 font-bold uppercase text-faint">
          <RoundWord state={state} />
        </span>
        <Extras
          score={theirs}
          pending={pending.get(pairing.opponent.teamId)}
          underway={underway}
          align="end"
        />
      </div>
    </section>
  );
}

/** The labelled line under one side of the scoreline. */
function Extras({
  score,
  pending,
  underway,
  align = "start",
}: {
  score: LiveTeamScore | undefined;
  pending: PendingCleanSheets | undefined;
  /** Whether the round is under way — not whether a ball is in the air. Between
   *  rounds every side has all played and nobody needs telling; in the gap
   *  between two Saturday kickoffs they very much do. */
  underway: boolean;
  align?: "start" | "end";
}) {
  // Literal zero is a statement, not an absence, so this reads the number rather
  // than its truthiness — a side whose eleven are all done said nothing at all
  // before, on the one tab a manager actually watches. Deliberately a copy of
  // `PairingCard`'s line and not an extraction: second occurrence (CODE_RULES
  // §1), and the desk shows no such count. The two must agree, which is the
  // whole reason this comment names the other one.
  //
  // What was the other half of this copy has gone: the pending mark reached four
  // screens on 31 Aug and is `league/Pending` now. What is left duplicated is
  // this sentence, and it is still only two.
  const left =
    score?.toPlay == null
      ? null
      : score.toPlay > 0
        ? `${score.toPlay} to play`
        : underway
          ? "all played"
          : null;

  return (
    <span
      className={`flex min-w-0 items-baseline gap-2 ${align === "end" ? "flex-row-reverse" : ""}`}
    >
      {left === null ? null : <span className="truncate text-faint">{left}</span>}
      <Pending points={pending?.points} />
    </span>
  );
}

function Half({
  team,
  score,
  against,
  mine = false,
  mirrored = false,
}: {
  team: LeagueTeam;
  score: LiveTeamScore | undefined;
  against: LiveTeamScore | undefined;
  mine?: boolean;
  mirrored?: boolean;
}) {
  const points = score?.points ?? null;
  const other = against?.points ?? null;

  return (
    // Into the head-to-head board, opened on the side that was tapped. The
    // summary answers "am I winning"; the board is where the players behind the
    // number are, which is the question the number provokes.
    <Link
      href={`/league/matchups/${team.teamId}`}
      className={`cm-row flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2 py-1.5 hover:bg-raised ${
 mirrored ?"flex-row-reverse":""
}`}
    >
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold ${
          mirrored ? "text-right" : "text-left"
        } ${mine ? "text-accent" : "text-ink"}`}
      >
        {team.name}
      </span>
      {/* The live number is the interface: biggest thing on the page. Only the
          number dims for trailing — a name that dimmed for losing would give
          accent a second meaning. */}
      <ScoreFigure
        points={points}
        other={other}
        className="numeric shrink-0 text-3xl font-bold leading-none"
      />
    </Link>
  );
}
