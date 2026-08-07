import Link from "next/link";
import {
  LEAGUE_NAME,
  POLL,
  type FootballSnapshot,
  adjacentGameweeks,
  isMatchdayLive,
} from "@epl/core";
import { londonDayAndTime, londonTime } from "../../londonTime";
import AutoRefresh from "../shell/AutoRefresh";
import LeagueCrest from "../shell/LeagueCrest";
import MatchList from "./MatchList";

// One round of football. Shared by the home route (whatever is live or next) and
// the /gw/[gameweek] route, so both stay identical rather than drifting.

export default function GameweekView({ snapshot }: { snapshot: FootballSnapshot }) {
  const live = isMatchdayLive(snapshot);
  const { previous, next } = adjacentGameweeks(snapshot);

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh seconds={live ? POLL.live : POLL.idle} />

      <header className="flex items-baseline justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <LeagueCrest height={26} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{LEAGUE_NAME}</h1>
            <p className="text-sm text-muted">Gameweek {snapshot.gameweek}</p>
          </div>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-live">
            <span className="live-dot" />
            Live
          </span>
        ) : snapshot.deadline ? (
          <span className="text-right text-xs text-faint">
            Deadline
            <br />
            <span className="numeric text-sm text-muted">
              {londonDayAndTime(snapshot.deadline)}
            </span>
          </span>
        ) : null}
      </header>

      <MatchList snapshot={snapshot} />

      <nav className="flex items-center justify-between gap-3 text-sm">
        <GameweekLink gameweek={previous} label="Previous" />
        <GameweekLink gameweek={next} label="Next" align="end" />
      </nav>

      <Link
        href="/team"
        className="min-h-11 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
      >
        Squads
      </Link>

      {/* Honesty about provenance, per PRODUCT.md principle 4. */}
      <p className="pt-1 text-center text-2xs text-faint">
        Live data from the Premier League. Updated {londonTime(snapshot.fetchedAt)}.
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
  const classes = `min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 ${
    align === "end" ? "text-right" : ""
  }`;

  if (gameweek === null) {
    return <span className={`${classes} text-faint opacity-40`}>{label}</span>;
  }

  return (
    <Link href={`/gw/${gameweek}`} className={`${classes} font-medium hover:bg-raised`}>
      {label}
      <span className="numeric text-muted"> · GW{gameweek}</span>
    </Link>
  );
}

