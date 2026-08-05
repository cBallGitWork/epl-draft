import { LEAGUE_NAME, getFootballSnapshot, isMatchdayLive } from "@epl/core";
import MatchList from "./components/MatchList";

// The live viewer. Runs entirely off FPL's public API, so it works from the first
// match of the season without Fantrax, a draft, or a single credential.

// Revalidate often enough to feel live; the fetch layer caches per-endpoint so
// this does not hammer FPL.
//
// This literal deliberately duplicates `REVALIDATE.live` from core config: Next
// requires a segment's `revalidate` to be statically analysable, so it cannot be
// imported. Change both together. (PLATFORM_NOTES records the exception.)
export const revalidate = 30;

export default async function HomePage() {
  const snapshot = await getFootballSnapshot();
  const live = isMatchdayLive(snapshot);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{LEAGUE_NAME}</h1>
          <p className="text-sm text-muted">Gameweek {snapshot.gameweek}</p>
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
            <span className="numeric text-sm text-muted">{formatDeadline(snapshot.deadline)}</span>
          </span>
        ) : null}
      </header>

      <MatchList snapshot={snapshot} />

      {/* Honesty about provenance, per PRODUCT.md principle 4. */}
      <p className="pt-1 text-center text-2xs text-faint">
        Live data from the Premier League. Updated {formatUpdated(snapshot.fetchedAt)}.
      </p>
    </div>
  );
}

function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

function formatUpdated(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}
