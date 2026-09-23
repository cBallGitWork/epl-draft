import Link from "next/link";
import ButtonLink from "../shell/ButtonLink";
import {
  LEAGUE_NAME,
  type FootballPlayer,
  type FootballSnapshot,
  type PlayerOwner,
  adjacentGameweeks,
  isMatchdayLive,
} from "@epl/core";
import { londonDayAndTime, londonTime } from "../../londonTime";
import { speaksForNow } from "../../football";
import LeagueCrest from "../shell/LeagueCrest";
import MatchList from "./MatchList";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE } from "@/app/desk";
import { SQUAD } from "../../squad/routes";

// One round of football. Shared by /matchday, while there is football on, and
// the /gw/[gameweek] route, so both stay identical rather than drifting.

export default function GameweekView({
  snapshot,
  mine,
  owners,
}: {
  snapshot: FootballSnapshot;
  /** Which of the reader's players are in each fixture. Optional throughout: a
   *  caller with no league to ask simply does not pass it, and the round renders
   *  as it always did. */
  mine?: Map<number, FootballPlayer[]>;
  /** Who holds each rostered footballer. Passed independently of `mine` — the
   *  tags are useful to a reader who owns nobody. */
  owners?: Map<number, PlayerOwner>;
}) {
  // Both halves: a match is in play AND our copy is fresh enough to say so. A
  // snapshot served from cache long after it was taken still has a fixture
  // marked live, because `status` carries no clock.
  const live = isMatchdayLive(snapshot) && speaksForNow(snapshot);
  const { previous, next } = adjacentGameweeks(snapshot);
  // A deadline is only news while it is ahead of you. The header shows LIVE or
  // the deadline, and between kickoffs mid-round it is neither: `duringGameweek`
  // keeps this view on screen all weekend while `isMatchdayLive` goes false in
  // every gap, so the slot fell through to a Friday instant printed as "Fri
  // 18:30" with a Saturday's football under it. Read off the snapshot's own
  // instant rather than a clock, so the render stays reproducible.
  const ahead =
    snapshot.deadline !== null && Date.parse(snapshot.deadline) > Date.parse(snapshot.fetchedAt);

  return (
    <div className="flex flex-col gap-4">
      <header className={GAMEWEEK_HEAD}>
        <div className="flex items-center gap-2.5">
          <LeagueCrest height={26} />
          <div>
            <h1 className={GAMEWEEK_TITLE}>{LEAGUE_NAME}</h1>
            <p className="text-sm text-muted">Gameweek {snapshot.gameweek}</p>
          </div>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-live">
            <span className="live-dot" />
            Live
          </span>
        ) : ahead && snapshot.deadline ? (
          /* FPL's, and it says so. This is `deadline_time` off the football
             layer — FPL's house rule, ninety minutes before the first kickoff —
             and ours is the commissioner's, fifteen minutes before it. For GW1
             they are 18:30 and 19:45. Under the bare word "Deadline" this told a
             manager on the Live tab that he had seventy-five minutes less than
             he had, while the front page and the League tab said otherwise.
             Named rather than replaced: this is a football component and the
             league's lock lives on the other side of the seam. */
          <span className="text-right text-xs text-faint">
            FPL deadline
            <br />
            <span className="numeric text-sm text-muted">
              {londonDayAndTime(snapshot.deadline)}
            </span>
          </span>
        ) : null}
      </header>

      <MatchList snapshot={snapshot} mine={mine} owners={owners} now={speaksForNow(snapshot)} />

      <nav className="flex items-center justify-between gap-3 text-sm">
        <GameweekLink gameweek={previous} label="Previous" />
        <GameweekLink gameweek={next} label="Next" align="end" />
      </nav>

      <ButtonLink href={SQUAD}>Squads</ButtonLink>

      {/* Honesty about provenance, per docs/rules/PRODUCT.md principle 4. Saying the stats
          are missing matters more than saying when: a scoreline with no scorers
          under it reads as nobody having done anything. */}
      <p className="pt-1 text-center text-2xs text-faint">
        {snapshot.statsUnavailable
          ? "The Premier League is not serving player stats right now, so the goals and assists below are missing rather than nil."
          : `Live data from the Premier League. Updated ${londonTime(snapshot.fetchedAt)}.`}
      </p>
    </div>
  );
}

/** Renders an inert placeholder at each end of the season so the other link
 *  keeps its position instead of sliding across the screen. */
function GameweekLink({
  gameweek,
  label,
  align = "start",
}: {
  gameweek: number | null;
  label: string;
  align?: "start" | "end";
}) {
  const classes = `min-h-11 flex-1 px-3 py-2.5 lg:min-h-9 ${
    align === "end" ? "text-right" : ""
  }`;

  // Not a plate, deliberately. Championship Manager fills the gap in a foot row
  // with a greyed "Unused" tab (`cm9900/12.jpg`), and a plate that does nothing
  // is the one thing worse than a gap — so a round that is not there keeps its
  // place with a flat outline, and only a round you can reach is a button.
  if (gameweek === null) {
    return (
      <span className={`${classes} border border-line text-faint opacity-40`}>{label}</span>
    );
  }

  // CM's foot pair — its own Back and Next. A bevel because it is a control, and
  // the plate owns its ink: no `text-*` here, and the round loses its `--muted`
  // for the same reason, which on the grey plate is 1.5:1 and was legible only
  // because the plate was not there yet.
  return (
    <Link
      href={`/gw/${gameweek}`}
      className={`cm-bevel ${classes} font-medium hover:brightness-110`}
    >
      {label}
      <span className="numeric"> · GW{gameweek}</span>
    </Link>
  );
}

