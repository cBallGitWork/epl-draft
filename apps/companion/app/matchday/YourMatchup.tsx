import Link from "next/link";
import {
  headToHead,
  roundState,
  type LeagueTeam,
  type LiveTeamScore,
  type PendingCleanSheets,
  inkOn,
  teamColours,
} from "@epl/core";
import RoundWord from "../components/league/RoundWord";
import { liveScores, pendingByTeam } from "../scoreboard";
import { roundUnderway } from "../football";
import { getLeagueSquads } from "../squads";
import { myTeamId } from "../session";
import { yoursBorder } from "../mine";
import Pending from "../components/league/Pending";
import { LABEL } from "@/app/desk";

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
    <section className={`cm-panel flex flex-col gap-2 p-2 ${yoursBorder(true)}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={LABEL}>
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
        <Half team={pairing.team} score={yours} mine />
        <Half team={pairing.opponent} score={theirs} />
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
    // Championship Manager's match header, with the managers where the clubs
    // are: `cm9900/21.jpg` sets Everton's blue against Arsenal's red and
    // `16.jpg` sets the same blue against Torquay's WHITE, so a pale side is a
    // case the reference has rather than an edge we invented — `inkOn` answers
    // it. Neither plate is mirrored and each score sits at ITS OWN right edge,
    // which is `MatchBar`'s recorded correction (Craig, 4 Sep: "the scores go on
    // the right hand side of each team row, currently its centered").
    <div
      className={`flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${
        mine ? "border-l-4 border-l-accent" : ""
      }`}
      style={{ background: colours.primary }}
    >
      <Link
        href={`/league/matchups/${team.teamId}`}
        className="flex min-w-0 flex-1 items-center self-stretch px-2"
      >
        {/* Accent ink is unavailable on a colour plate, so "yours" is carried by
            the edge and by position — `mine.ts`'s own mark, and the reason it
            exists as a border rather than only as an ink. */}
        <span
          className="cm-title min-w-0 flex-1 truncate font-chrome text-base font-bold uppercase lg:text-2xl"
          style={{ color: ink }}
        >
          {team.name}
        </span>
      </Link>
      {/* **The plate owns its ink**, so nothing sets `text-*` in here. That is
          not a style note: `--color-ink` on the grey bevel is 2.27:1 and the
          dimmed trailing side is lower still, which is why `ScoreFigure` — whose
          whole job is to dim the trailing figure — may not come inside the box.
          The dash for a total Fantrax did not give is kept by hand. */}
      {/* Narrower and a step smaller under a thumb than on the desk, measured:
          at `w-16 text-2xl` the away plate had 79px for a name and clipped
          `test31` to `TEST…`. A manager's own name may not truncate on the one
          screen that is about him, and the score is still the biggest figure on
          the page at `text-xl`. `w-14` holds a Fantrax total's four characters
          (`61.4`), which is the widest thing this box ever carries. */}
      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? "\u2014" : points}
      </span>
    </div>
  );
}
